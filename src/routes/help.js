import express from 'express';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Main help page
router.get('/help', requireAuth, (req, res) => {
  res.render('help/index', {
    pageTitle: 'Help Center',
    user: req.session.user
  });
});

// Getting Started
router.get('/help/getting-started', requireAuth, (req, res) => {
  res.render('help/getting-started', {
    pageTitle: 'Getting Started',
    user: req.session.user
  });
});

// User Roles & Access
router.get('/help/roles', requireAuth, (req, res) => {
  res.render('help/roles', {
    pageTitle: 'User Roles & Access',
    user: req.session.user
  });
});

// How-To Guides
router.get('/help/how-to', requireAuth, (req, res) => {
  res.render('help/how-to', {
    pageTitle: 'How-To Guides',
    user: req.session.user
  });
});

// FAQs
router.get('/help/faq', requireAuth, (req, res) => {
  res.render('help/faq', {
    pageTitle: 'Frequently Asked Questions',
    user: req.session.user
  });
});

// Troubleshooting
router.get('/help/troubleshooting', requireAuth, (req, res) => {
  res.render('help/troubleshooting', {
    pageTitle: 'Troubleshooting',
    user: req.session.user
  });
});

// Video Tutorials
router.get('/help/videos', requireAuth, (req, res) => {
  res.render('help/videos', {
    pageTitle: 'Video Tutorials',
    user: req.session.user
  });
});

// Contact Support
router.get('/help/contact', requireAuth, (req, res) => {
  res.render('help/contact', {
    pageTitle: 'Contact Support',
    user: req.session.user
  });
});

// Release Notes
router.get('/help/release-notes', requireAuth, (req, res) => {
  res.render('help/release-notes', {
    pageTitle: 'Release Notes',
    user: req.session.user
  });
});

// Keyboard Shortcuts
router.get('/help/shortcuts', requireAuth, (req, res) => {
  res.render('help/shortcuts', {
    pageTitle: 'Keyboard Shortcuts',
    user: req.session.user
  });
});

// Privacy Policy
router.get('/help/privacy', requireAuth, (req, res) => {
  res.render('help/privacy', {
    pageTitle: 'Privacy & Data Policy',
    user: req.session.user
  });
});

export default router;