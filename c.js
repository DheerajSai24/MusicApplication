console.log("Script file is started");

let currentSong = new Audio();
let songs = [];
let currentIndex = 0;
let currentFolder = "";

// Folder cover images for different genre folders
const folderCovers = {
    "love hits": "https://i.scdn.co/image/ab67616d00001e02497b38a2a59095193de438d1",
    "telugu hits": "https://i.scdn.co/image/ab67616d00001e0283141000ee8ce3b893a0b425",
    "hindi hits": "https://i.scdn.co/image/ab67616d00001e020c877acde30dad1997723dba",
    "default": "https://i.scdn.co/image/ab67616d00001e0285c5968be0d0d9c545241124"
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
    try {
        let a = await fetch(`http://127.0.0.1:3000/songs`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let folders = [];
        
        for (let index = 0; index < anchors.length; index++) {
            const element = anchors[index];
            if (element.href.endsWith("/") && !element.href.endsWith("songs/")) {
                // Extract folder name from the URL
                let folderName = element.href.split("/").slice(-2)[0];
                folders.push(folderName);
            }
        }
        return folders;
    } catch (error) {
        console.error("Error fetching folders:", error);
        return [];
    }
}

// Get songs from a specific folder
async function getSongs(folder) {
    try {
        currentFolder = folder;
        let a = await fetch(`http://127.0.0.1:3000/songs/${folder}`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        let songsList = [];
        
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songsList.push(decodeURI(element.href.split(`/${folder}/`)[1]));
            }
        }
        return songsList;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Display folders in the Albums section
function displayFolders(folders) {
    let albumsContainer = document.querySelector(".albumsContainer");
    albumsContainer.innerHTML = "";
    
    folders.forEach(folder => {
        // Get cover image for folder or use default
        const coverImg = folderCovers[folder.toLowerCase()] || folderCovers["default"];
        
        // Create album card for each folder
        const albumCard = document.createElement("div");
        albumCard.classList.add("albumCard");
        albumCard.dataset.folder = folder;
        
        albumCard.innerHTML = `
            <img src="${coverImg}" alt="${folder}">
            <div class="folderName">${folder}</div>
            <div class="songCount">Folder</div>
        `;
        
        // Add click event to load songs from this folder
        albumCard.addEventListener("click", () => {
            loadFolderSongs(folder);
        });
        
        albumsContainer.appendChild(albumCard);
    });
}

// Load songs from selected folder and display them
async function loadFolderSongs(folder) {
    // Update the UI to highlight the selected folder
    document.querySelectorAll(".albumCard").forEach(card => {
        if (card.dataset.folder === folder) {
            card.style.backgroundColor = "#2a2a2a";
        } else {
            card.style.backgroundColor = "transparent";
        }
    });
    
    // Load songs from the selected folder
    songs = await getSongs(folder);
    
    // Update the song list in the left panel
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    
    songs.forEach((song, index) => {
        const songName = song.replace(".mp3", "");
        
        songUL.innerHTML += `<li>
            <i class="fa-solid fa-music"></i>
            <div class="info">
                <div class="songname">${songName}</div>
                <div class="artist">From: ${folder}</div>
            </div>
            <div class="playnow">
                <i class="fa-solid fa-circle-play"></i>
            </div>
        </li>`;
    });
    
    // Add click event listeners to the songs in the list
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index], index);
        });
    });
    
    // If there are songs in the folder, set the first one as current
    if (songs.length > 0) { 
        currentSong.src = `/songs/${folder}/${songs[0]}`;
        document.getElementById("songname").innerHTML = songs[0].replace(".mp3", "");
        document.getElementById("songtime").innerHTML = "00:00/00:00";
    }
}

// Play a specific song
const playMusic = (track, index) => {
    currentSong.src = `/songs/${currentFolder}/${track}`;
    currentSong.play()
        .then(() => {
            // Update UI elements once song starts playing
            currentIndex = index;
            document.getElementById("songname").innerHTML = track.replace(".mp3", "");
            document.getElementById("play").setAttribute("class", "fa-solid fa-circle-pause");
            
            // Highlight the currently playing song in the list
            highlightCurrentSong();
        })
        .catch(error => {
            console.error("Error playing song:", error);
        });
}

// Play next song
const playNext = () => {
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
}

// Play previous song
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
    // Load and display all folders
    const folders = await getFolders();
    displayFolders(folders);
    
    // If folders exist, load songs from the first folder by default
    if (folders.length > 0) {
        loadFolderSongs(folders[0]);
    }
    
    // Set up event listener for timeupdate
    currentSong.addEventListener("timeupdate", () => {
        document.getElementById("songtime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`;
        
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });
    
    // Play next song when current ends
    currentSong.addEventListener("ended", () => {
        playNext();
    });
    
    // Play/pause button functionality
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
    
    // Next/previous button handlers
    document.getElementById("next").addEventListener("click", playNext);
    document.getElementById("previous").addEventListener("click", playPrevious);
    
    // Mobile menu handlers
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });
    
    document.querySelector("#close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });
    
    setupSeekbar();
}
 
main();