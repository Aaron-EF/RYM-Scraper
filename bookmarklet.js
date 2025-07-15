let extractedData = [];

function showStatus(message, type = 'info') {
  alert(message); // Simplified for bookmarklet
}

function extractData() {
  const albumElements = document.querySelectorAll('.collection_album, .album_row, .mbgen, .or_q_album_row');
  if (albumElements.length === 0) {
    showStatus('No albums found. Are you on your RYM collection page?');
    return;
  }

  let newAlbums = 0;
  albumElements.forEach((element) => {
    const albumData = extractAlbumData(element);
    if (albumData && !isDuplicate(albumData)) {
      extractedData.push(albumData);
      newAlbums++;
    }
  });

  showStatus(`✅ Extracted ${newAlbums} albums!`);
  console.log(extractedData);
}

function extractAlbumData(element) {
  const data = {};
  const title = element.querySelector('.album_title a, .album a, .mbgen a');
  const artist = element.querySelector('.album_artist a, .artist a');
  const date = element.querySelector('.album_date, .date');
  const rating = element.querySelector('.rating, .mbgen_rating, .or_q_rating_date_num');
  const rymRating = element.querySelector('.rym_rating, .avgrating');
  const genres = element.querySelectorAll('.genre, .mbgen_genre');

  data.albumTitle = title?.textContent.trim() || '';
  data.artistName = artist?.textContent.trim() || '';
  data.releaseDate = date?.textContent.trim() || '';
  data.userRating = rating?.textContent.trim() || '';
  data.rymRating = rymRating?.textContent.trim() || '';
  data.genres = [...genres].map(el => el.textContent.trim()).join(', ');
  data.albumUrl = title ? 'https://rateyourmusic.com' + title.getAttribute('href') : '';

  if (data.albumTitle && data.artistName) return data;
  return null;
}

function isDuplicate(newAlbum) {
  return extractedData.some(existing =>
    existing.albumTitle === newAlbum.albumTitle &&
    existing.artistName === newAlbum.artistName
  );
}

extractData();
