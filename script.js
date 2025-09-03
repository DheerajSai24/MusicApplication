console.log("Script file is started");

let currentSong = new Audio();
let songs = [];
let currentIndex = 0;
let currentFolder = "";

// Folder cover images for different genre folders
const folderCovers = {
    "love hits": "https://i.scdn.co/image/ab67616d00001e02497b38a2a59095193de438d1",
    "telugu songs": "https://i.scdn.co/image/ab67616d00001e0283141000ee8ce3b893a0b425",
    "hindi hits": "https://i.scdn.co/image/ab67616d00001e020c877acde30dad1997723dba",
    "english songs": "https://i.scdn.co/image/ab67616d00001e02bf94e27360d7005b236f9988"
};

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const rounded = Math.floor(seconds);
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
}

function normalizeClassName(folder) {
    return folder.toLowerCase().replace(/\s+/g, '');
}


// Get all folders from the songs directory
async function getFolders() {
    // Return the known folders directly
    return [
        "love hits",
        "hindi hits",
        "telugu songs",
        "english songs"
    ];
} 

async function getSongs(folder) {
    currentFolder = folder;
    try {
        // Using Spotify Web API with client credentials
        const CLIENT_ID = 'c785906446bd48e3978fbb26db3c6430';
        const CLIENT_SECRET = '7e4c5479f1734790956c3b7dcbf21648';

        // Get access token
        const authResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });
        
        const authData = await authResponse.json();
        
        let query = '';
        switch(folder.toLowerCase()) {
            case 'love hits':
                query = 'romantic bollywood';
                break;
            case 'hindi hits':
                query = 'trending hindi';
                break;
            case 'telugu songs':
                query = 'telugu hits';
                break;
            case 'english songs':
                query = 'english pop hits';
                break;
        }

        // Search for tracks
        const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
            {
                headers: {
                    'Authorization': 'Bearer ' + authData.access_token
                }
            }
        );
        
        const searchData = await searchResponse.json();
        console.log('API Response:', searchData); // Debug log

        if (searchData.tracks && searchData.tracks.items) {
            return searchData.tracks.items.map(track => ({
                name: track.name,
                artist: track.artists[0].name,
                duration: Math.floor(track.duration_ms / 1000),
                preview_url: track.preview_url,
                image: track.album.images[0].url
            }));
        } else {
            console.error('No tracks found in response:', searchData);
            throw new Error('No tracks found in API response');
        }
    } catch (error) {
        console.error("Error fetching songs:", error);
        // Return some sample data as fallback
        return [
            {
                name: "Connection Error",
                artist: "Please check your internet connection",
                duration: 0,
                preview_url: null,
                image: folderCovers[folder.toLowerCase()]
            }
        ];
    }
}
}


function displayFolders(folders) {
    let albumsContainer = document.querySelector(".albumsContainer");
    albumsContainer.innerHTML = "";
    
    folders.forEach(folder => {
        const coverImg = folderCovers[folder.toLowerCase()];
        
        
        const albumCard = document.createElement("div");
        albumCard.classList.add("albumCard");
        albumCard.dataset.folder = folder;
        
        albumCard.innerHTML = `
            <img src="${coverImg}" alt="${folder}">
            <div class="folderName">${folder}</div>
            <div class="songCount">Folder</div>
        `;
        
        
        albumCard.addEventListener("click", () => {
            loadFolderSongs(folder);
        });
        
        albumsContainer.appendChild(albumCard);
    });
}


async function loadFolderSongs(folder) {
    
    document.querySelectorAll(".albumCard").forEach(card => {
        if (card.dataset.folder === folder) {
            card.style.backgroundColor = "#2a2a2a";
        } else {
            card.style.backgroundColor = "transparent";
        }
    });
     
    songs = await getSongs(folder);
     
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    
    songs.forEach((song, index) => {
        songUL.innerHTML += `<li>
            <i class="fa-solid fa-music"></i>
            <div class="info">
                <div class="songname">${song.name}</div>
                <div class="artist">${song.artist}</div>
                <div class="album-info">Category: ${currentFolder}</div>
            </div>
            <div class="playnow">
                <span class="duration">${formatTime(song.duration)}</span>
                <i class="fa-solid ${song.preview_url ? 'fa-circle-play' : 'fa-circle-minus'}" 
                   title="${song.preview_url ? 'Play preview' : 'No preview available'}"></i>
            </div>
        </li>`;
    });
    
    
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index], index);
        });
    });
    
    
    if (songs.length > 0) { 
        currentSong.src = songs[0].preview_url;
        document.getElementById("songname").innerHTML = `${songs[0].name} - ${songs[0].artist}`;
        document.getElementById("songtime").innerHTML = "00:00/00:00";
    }
}


const playMusic = (track, index) => {
    if (!track.preview_url) {
        alert("No preview available for this song");
        return;
    }

    currentSong.src = track.preview_url;
    currentIndex = index;
    
    currentSong.play()
        .then(() => {
            document.getElementById("songname").innerHTML = `${track.name} - ${track.artist}`;
            document.getElementById("play").setAttribute("class", "fa-solid fa-circle-pause");
            highlightCurrentSong();
        })
        .catch(error => {
            console.error("Error playing song:", error);
            alert("Unable to play this song. Please try another.");
        });
}




const playNext = () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
}


const playPrevious = () => {
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
}

function highlightCurrentSong() {
    const songItems = document.querySelectorAll(".songList li");
    songItems.forEach(item => {
        item.style.backgroundColor = "transparent";
    });
    
    if (songItems[currentIndex]) {
        songItems[currentIndex].style.backgroundColor = "#2a2a2a";
    }
}

function setupSeekbar() {
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    
    seekbar.addEventListener("click", function(e) {
        if (!currentSong.src) return;
        
        const rect = this.getBoundingClientRect();
        const clickPosition = e.clientX - rect.left;
        const seekbarWidth = rect.width;
        
        const percentage = clickPosition / seekbarWidth;
        
        if (currentSong.duration) {
            currentSong.currentTime = percentage * currentSong.duration;
            circle.style.left = (percentage * 100) + "%";
        }
    });
    
    seekbar.addEventListener("mouseover", function() {
        circle.style.transform = "scale(1.2)";
        circle.style.transition = "transform 0.2s ease";
    });
    
    seekbar.addEventListener("mouseout", function() {
        circle.style.transform = "scale(1)";
    });
}

async function main() {  
    const folders = await getFolders();
    displayFolders(folders);
    
     
    if (folders.length > 0) {
        loadFolderSongs(folders[0]);
    }
     
    currentSong.addEventListener("timeupdate", () => {
        document.getElementById("songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
        
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });
    
    

    currentSong.addEventListener("ended", () => {
        playNext();
    });
    
    
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            if (currentSong.src) {
                currentSong.play();
                document.getElementById("play").setAttribute("class", "fa-solid fa-circle-pause");
            } else if (songs.length > 0) { 
                playMusic(songs[0], 0);
            }
        } else {
            currentSong.pause();
            document.getElementById("play").setAttribute("class", "fa-solid fa-circle-play");
        }
    });
    
    
    document.getElementById("next").addEventListener("click", playNext);
    document.getElementById("previous").addEventListener("click", playPrevious);
    
    
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });
    
    document.querySelector("#close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
    
    setupSeekbar();
}
 
main();