const generateUrl = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateUrl,
};
