document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsContainer = document.getElementById('results-container');
    
    const player = document.getElementById('player');
    const audioPlayer = document.getElementById('audio-player');
    const playerArtwork = document.getElementById('player-artwork');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playPauseButton = document.getElementById('play-pause-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');

    let currentQueue = [];
    let currentQueueIndex = -1;

    async function search(query) {
        if (!query) return;
        
        resultsContainer.innerHTML = '<p class="text-gray-400">Searching...</p>';
        const proxyUrl = `/api/proxy?endpoint=search&q=${encodeURIComponent(query)}`;
        
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            displayResults(data.items); // Piped API returns results in 'items'
        } catch (error) {
            console.error('Error searching:', error);
            resultsContainer.innerHTML = `<p class="text-red-500">Error fetching search results. The API proxy might be down or blocking requests. Please try again later.</p>`;
        }
    }

    function displayResults(items) {
        if (!items || items.length === 0) {
            resultsContainer.innerHTML = '<p class="text-gray-400">No results found.</p>';
            return;
        }

        currentQueue = items.filter(item => item.type === 'stream'); // Filter for playable streams
        resultsContainer.innerHTML = currentQueue.map((item, index) => `
            <div class="result-item" data-index="${index}">
                <img src="${item.thumbnail}" alt="Thumbnail">
                <div class="result-item-info">
                    <h3>${item.title}</h3>
                    <p>${item.uploaderName}</p>
                </div>
            </div>
        `).join('');
    }

    async function playTrack(index) {
        if (index < 0 || index >= currentQueue.length) {
            audioPlayer.pause();
            playPauseButton.innerHTML = '<i class="fas fa-play-circle fa-3x"></i>';
            return;
        }

        currentQueueIndex = index;
        const track = currentQueue[index];
        const videoId = track.url.split('v=')[1];
        
        const streamUrl = await getStreamUrl(videoId);

        if (streamUrl) {
            player.style.display = 'flex';
            playerArtwork.src = track.thumbnail;
            playerTitle.textContent = track.title;
            playerArtist.textContent = track.uploaderName;

            audioPlayer.src = streamUrl;
            audioPlayer.play();
            playPauseButton.innerHTML = '<i class="fas fa-pause-circle fa-3x"></i>';
        } else {
            console.error('Could not get stream URL for ' + videoId);
            playTrack(currentQueueIndex + 1); // Try the next track
        }
    }

    async function getStreamUrl(videoId) {
        try {
            const proxyUrl = `/api/proxy?endpoint=stream&videoId=${videoId}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error('Failed to get video info');
            }
            const data = await response.json();
            
            const audioStream = data.audioStreams
                .filter(s => s.mimeType.includes('mp4')) // Prefer M4A for broader compatibility
                .sort((a, b) => b.bitrate - a.bitrate)[0];
            
            return audioStream ? audioStream.url : null;
        } catch (error) {
            console.error('Error getting stream URL:', error);
            return null;
        }
    }

    function togglePlayPause() {
        if (!audioPlayer.src) return;
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseButton.innerHTML = '<i class="fas fa-pause-circle fa-3x"></i>';
        } else {
            audioPlayer.pause();
            playPauseButton.innerHTML = '<i class="fas fa-play-circle fa-3x"></i>';
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateProgress() {
        if (!audioPlayer.duration) return;
        const { currentTime, duration } = audioPlayer;
        progressBar.value = (currentTime / duration) * 100;
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    }

    // Event Listeners
    searchButton.addEventListener('click', () => search(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            search(searchInput.value);
        }
    });

    resultsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.result-item');
        if (item) {
            const index = parseInt(item.dataset.index, 10);
            playTrack(index);
        }
    });

    playPauseButton.addEventListener('click', togglePlayPause);
    
    prevButton.addEventListener('click', () => {
        playTrack(currentQueueIndex - 1);
    });

    nextButton.addEventListener('click', () => {
        playTrack(currentQueueIndex + 1);
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', () => {
        playTrack(currentQueueIndex + 1);
    });

    progressBar.addEventListener('input', (e) => {
        if (!audioPlayer.duration) return;
        const { duration } = audioPlayer;
        const newTime = (e.target.value / 100) * duration;
        audioPlayer.currentTime = newTime;
    });

    // Dynamic Background Logic
    window.addEventListener('scroll', () => {
        const bgLayer = document.getElementById('dynamic-background');
        const scrollPos = window.scrollY;
        const triggerHeight = 600; 
        let opacity = scrollPos / triggerHeight;
        if (opacity > 1) opacity = 1;
        if (bgLayer) bgLayer.style.opacity = opacity;
    });
});
// Made with ❤️ from 4SP
