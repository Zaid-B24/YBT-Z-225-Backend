class SessionService {
  async createSession(req, user) {
    return new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);

        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };

        req.session.save((saveErr) => {
          if (saveErr) return reject(saveErr);
          resolve();
        });
      });
    });
  }

  async destroySession(req, res) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        res.clearCookie("sid");
        resolve();
      });
    });
  }

  getSessionUser(req) {
    return req.session?.user;
  }
}

module.exports = new SessionService();
