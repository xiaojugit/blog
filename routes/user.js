var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();

var UserModel = require('../models/users');
var checkLogin = require('../middlewares/check').checkLogin;

// GET /user 用户信息页
router.get('/', checkLogin, function(req, res, next) {
  var name = req.session.user.name;
  res.render('user');
  // 用户信息
  UserModel.getUserByName(name)
    .then(function(user) {
      res.render('user', {
        user: user
      });
    })
    .catch(next);
});

// POST /user 修改用户名
router.post('/name', checkLogin, function(req, res, next) {
  var userId = req.session.user._id;
  var name;
  if (name) {
    name = req.fields.name;
    try {
      if (!(name.length >= 1 && name.length <= 10)) {
        throw new Error('名字请限制在 1-10 个字符');
      }
    } catch (e) {
      req.flash('error', e.message);
      return res.redirect('/user');
    }
  } else {
    return false;
  }

  UserModel.updateUserInfoById(userId, {
      name: name
    })
    .then(function() {
      req.session.user.name = name;

      req.flash('success', '修改用户名成功');
      // 编辑成功后刷新当前页
      res.redirect('/user');
    })
    .catch(next);
});

// POST /user 修改密码
router.post('/password', checkLogin, function(req, res, next) {
  var userId = req.session.user._id;
  var username = req.session.user.name;
  var oldPassword, newPassword, repassword;

  if (req.fields.oldPassword && req.fields.newPassword && req.fields.repassword) {
    oldPassword = req.fields.oldPassword;
    newPassword = req.fields.newPassword;
    repassword = req.fields.repassword;
    try {
      if (newPassword.length < 6) {
        throw new Error('密码至少 6 个字符');
      }
      if (newPassword !== repassword) {
        throw new Error('两次输入密码不一致');
      }
    } catch (e) {
      req.flash('error', e.message);
      return res.redirect('/user');
    }
  } else {
    req.flash('error', '密码不能为空');
    return res.redirect('/user');
  }

  // 明文密码加密
  oldPassword = sha1(oldPassword);
  newPassword = sha1(newPassword);

  UserModel.getUserByName(username)
    .then(function(user) {
      // 检查密码是否匹配
      if (oldPassword !== user.password) {
        req.flash('error', '旧密码错误');
        return res.redirect('/user');
      }
      UserModel.updateUserInfoById(userId, {
          password: newPassword
        })
        .then(function() {
          req.flash('success', '修改密码成功');
          // 编辑成功后刷新当前页
          res.redirect('/user');
        })
        .catch(next);
    }).catch(next);

});

// POST /user 修改头像
router.post('/avatar', checkLogin, function(req, res, next) {
  var userId = req.session.user._id;
  var avatar;

  if (req.files.avatar.name) {
    avatar = req.files.avatar.path.split(path.sep).pop();
  } else {
    return false;
  }
  try {
    if (!req.files.avatar.name) {
      throw new Error('缺少头像');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('/user');
  }

  UserModel.updateUserInfoById(userId, {
      avatar: avatar
    })
    .then(function() {
      req.session.user.avatar = avatar;

      req.flash('success', '修改头像成功');
      // 编辑成功后刷新当前页
      res.redirect('/user');
    })
    .catch(next);
});

// POST /user 修改个人签名
router.post('/bio', checkLogin, function(req, res, next) {
  var userId = req.session.user._id;
  var bio;
  if (req.fields.bio) {
    bio = req.fields.bio;
    try {
      if (!(bio.length >= 1 && bio.length <= 30)) {
        throw new Error('个人简介请限制在 1-30 个字符');
      }
    } catch (e) {
      req.flash('error', e.message);
      return res.redirect('/user');
    }
  } else {
    return false;
  }

  UserModel.updateUserInfoById(userId, {
      bio: bio
    })
    .then(function() {
      req.session.user.bio = bio;

      req.flash('success', '修改个人签名成功');
      // 编辑成功后刷新当前页
      res.redirect('/user');
    })
    .catch(next);
});

module.exports = router;
