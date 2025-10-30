//validating the url
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
//valiadting passward length minimum 8 characters
export function validatePassphrase(passphrase) {
  return passphrase && passphrase.length >= 8;
}
