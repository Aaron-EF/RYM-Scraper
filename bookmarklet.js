    <script>
        let extractedData = [];
        
        function showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }
        
        function updateProgress(current, total) {
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            
            if (current === 0) {
                progressBar.style.display = 'block';
            }
            
            const percentage = (current / total) * 100;
            progressFill.style.width = percentage + '%';
            
            if (current === total) {
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 1000);
            }
        }
        
        function extractData() {
            try {
                // Check if we're on a RateYourMusic page
                if (!window.location.hostname.includes('rateyourmusic.com')) {
                    showStatus('Please navigate to your RateYourMusic collection page first!', 'error');
                    return;
                }
                
                // Look for album elements - RYM uses different selectors
                const albumElements = document.querySelectorAll('.collection_album, .album_row, .mbgen, .or_q_album_row');
                
                if (albumElements.length === 0) {
                    showStatus('No albums found on this page. Make sure you\'re on your collection page and albums are loaded.', 'error');
                    return;
                }
                
                showStatus(`Found ${albumElements.length} albums on this page. Extracting data...`, 'info');
                updateProgress(0, albumElements.length);
                
                let newAlbums = 0;
                
                albumElements.forEach((element, index) => {
                    setTimeout(() => {
                        try {
                            const albumData = extractAlbumData(element);
                            if (albumData && !isDuplicate(albumData)) {
                                extractedData.push(albumData);
                                newAlbums++;
                            }
                            updateProgress(index + 1, albumElements.length);
                            
                            if (index === albumElements.length - 1) {
                                showStatus(`Successfully extracted ${newAlbums} new albums! Total: ${extractedData.length}`, 'success');
                                updateDisplay();
                            }
                        } catch (error) {
                            console.error('Error extracting album data:', error);
                        }
                    }, index * 50); // Small delay to prevent overwhelming the browser
                });
                
            } catch (error) {
                showStatus('Error extracting data: ' + error.message, 'error');
                console.error('Extraction error:', error);
            }
        }
        
        function extractAlbumData(element) {
            const data = {};
            
            try {
                // Album title and artist - try multiple selectors
                const titleElement = element.querySelector('.album_title a, .album a, .mbgen a');
                const artistElement = element.querySelector('.album_artist a, .artist a');
                
                data.albumTitle = titleElement ? titleElement.textContent.trim() : '';
                data.artistName = artistElement ? artistElement.textContent.trim() : '';
                
                // Release date
                const dateElement = element.querySelector('.album_date, .date');
                data.releaseDate = dateElement ? dateElement.textContent.trim() : '';
                
                // Rating
                const ratingElement = element.querySelector('.rating, .mbgen_rating, .or_q_rating_date_num');
                data.userRating = ratingElement ? ratingElement.textContent.trim() : '';
                
                // RYM Rating
                const rymRatingElement = element.querySelector('.rym_rating, .avgrating');
                data.rymRating = rymRatingElement ? rymRatingElement.textContent.trim() : '';
                
                // Genres
                const genreElements = element.querySelectorAll('.genre, .mbgen_genre');
                data.genres = Array.from(genreElements).map(el => el.textContent.trim()).join(', ');
                
                // Get additional data by following the album link if available
                const albumLink = titleElement ? titleElement.getAttribute('href') : '';
                if (albumLink) {
                    data.albumUrl = 'https://rateyourmusic.com' + albumLink;
                }
                
                // If we have at least title and artist, consider it valid
                if (data.albumTitle && data.artistName) {
                    return data;
                }
                
            } catch (error) {
                console.error('Error extracting individual album data:', error);
            }
            
            return null;
        }
        
        function isDuplicate(newAlbum) {
            return extractedData.some(existing => 
                existing.albumTitle === newAlbum.albumTitle && 
                existing.artistName === newAlbum.artistName
            );
        }
        
        function updateDisplay() {
            const preview = document.getElementById('dataPreview');
            const count = document.getElementById('albumCount');
            
            count.textContent = extractedData.length;
            
            if (extractedData.length === 0) {
                preview.innerHTML = '<p>No data extracted yet. Please follow the instructions above.</p>';
                return;
            }
            
            let html = '<h3>Extracted Albums Preview (showing last 10):</h3>';
            const recentAlbums = extractedData.slice(-10);
            
            recentAlbums.forEach(album => {
                html += `
                    <div class="album-item">
                        <div class="album-title">${album.albumTitle}</div>
                        <div class="album-artist">by ${album.artistName}</div>
                        <div class="album-details">
                            <div><strong>Release Date:</strong> ${album.releaseDate}</div>
                            <div><strong>Your Rating:</strong> ${album.userRating}</div>
                            <div><strong>RYM Rating:</strong> ${album.rymRating}</div>
                            <div><strong>Genres:</strong> ${album.genres}</div>
                        </div>
                    </div>
                `;
            });
            
            preview.innerHTML = html;
        }
        
        function clearData() {
            extractedData = [];
            updateDisplay();
            showStatus('All data cleared.', 'info');
        }
        
        function downloadCSV() {
            if (extractedData.length === 0) {
                showStatus('No data to download. Please extract some data first.', 'error');
                return;
            }
            
            const headers = ['Album Title', 'Artist Name', 'Release Date', 'Your Rating', 'RYM Rating', 'Genres', 'Album URL'];
            const csvContent = [
                headers.join(','),
                ...extractedData.map(album => [
                    `"${album.albumTitle}"`,
                    `"${album.artistName}"`,
                    `"${album.releaseDate}"`,
                    `"${album.userRating}"`,
                    `"${album.rymRating}"`,
                    `"${album.genres}"`,
                    `"${album.albumUrl || ''}"`
                ].join(','))
            ].join('\n');
            
            downloadFile(csvContent, 'rateyourmusic_collection.csv', 'text/csv');
            showStatus('CSV file downloaded successfully!', 'success');
        }
        
        function downloadJSON() {
            if (extractedData.length === 0) {
                showStatus('No data to download. Please extract some data first.', 'error');
                return;
            }
            
            const jsonContent = JSON.stringify(extractedData, null, 2);
            downloadFile(jsonContent, 'rateyourmusic_collection.json', 'application/json');
            showStatus('JSON file downloaded successfully!', 'success');
        }
        
        function downloadFile(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            showStatus('Ready to extract data. Please follow the instructions above.', 'info');
        });
    </script>
