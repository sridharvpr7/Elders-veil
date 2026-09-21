function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function isValidUsername(username) {
  return typeof username === 'string' && username.trim().length >= 3 && username.trim().length <= 30;
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function validateComicInput(data) {
  const errors = [];
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Title is required');
  }
  if (data.rating !== undefined && (isNaN(data.rating) || data.rating < 0 || data.rating > 5)) {
    errors.push('Rating must be a number between 0 and 5');
  }
  return errors;
}

function validateChapterInput(data) {
  const errors = [];
  if (data.chapterNumber === undefined || isNaN(data.chapterNumber) || Number(data.chapterNumber) <= 0) {
    errors.push('Valid chapter number is required');
  }
  return errors;
}

module.exports = {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  validateComicInput,
  validateChapterInput
};
