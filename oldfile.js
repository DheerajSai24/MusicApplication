console.log("Script file is started");

let currentSong = new Audio();
let songs = [];
let currentIndex = 0;

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const rounded = Math.floor(seconds);
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');
    return `${formattedMins}:${formattedSecs}`;
}

async function getSongs() {
    try {
        let a = await fetch("http://127.0.0.1:3000/songs/");
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        let songsList = [];
        
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songsList.push(decodeURI(element.href).split("/songs/")[1]);
            }
        }
        return songsList;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Play a specific song
const playMusic = (track, index) => {
    currentSong.src = "/songs/" + track;
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
    songs = await getSongs();
    
    
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; 
    
    songs.forEach((song, index) => {
        
        const songName = song.replace(".mp3", "");
        
        songUL.innerHTML += `<li>
            <i class="fa-solid fa-music"></i>
            <div class="info">
                <div class="songname">${songName}</div>
                <div class="artist">Arijit Singh</div>
            </div>
            <div class="playnow">
                <i class="fa-solid fa-circle-play"></i>
            </div>
        </li>`;
    });
    
    
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index], index);
        });
    });
    
    // Set up event listener for timeupdate
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
    if (songs.length > 0) { 
        currentSong.src = "/songs/" + songs[0];
        document.getElementById("songname").innerHTML = songs[0].replace(".mp3", "");
        document.getElementById("songtime").innerHTML = "00:00/00:00";
    }
}
 
main();