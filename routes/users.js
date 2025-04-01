var User = require('../models/user.js');
var Task = require('../models/task.js');

module.exports = function (router) {
    var userRoute = router.route('/users');

    userRoute.get(async function (req, res) {
        try {
            const data = await User.find(JSON.parse(req.query.where || '{}'))
                .sort(JSON.parse(req.query.sort || '{}'))
                .select(JSON.parse(req.query.select || '{}'))
                .skip(parseInt(req.query.skip) || 0)
                .limit(parseInt(req.query.limit) || 0)
                .exec();
            res.status(200).send({
                message: 'Users Retrieved Successfully',
                data: req.query.count ? data.length : data
            });
        } catch (error) {
            res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    userRoute.post(async function (req, res) {
        var user = new User();
        if ('name' in req.body && req.body.name !== undefined) {
            user.name = req.body.name;
        } else {
            return res.status(404).send({
                message: 'Name Field Required',
                data: []
            });
        }
        if ('email' in req.body && req.body.email !== undefined) {
            User.findOne({ email: req.body.email }).exec()
                .then(function (match) {
                    if (match == null) {
                        user.email = req.body.email;
                        var promises = [];
                        if ('pendingTasks' in req.body && req.body.pendingTasks !== undefined) {
                            req.body.pendingTasks.forEach(function (id) {
                                promises.push(Task.findById(id).exec());
                            });
                        }
                        user.pendingTasks = [];
                        Promise.all(promises).then(function (values) {
                            values.forEach(function (task) {
                                if (task != null) {
                                    user.pendingTasks.push(task.id);
                                }
                            });
                            user.save().then(function (data) {
                                var newUserId = data.id;
                                var newUserName = data.name;

                                var newPromises = [];
                                data.pendingTasks.forEach(function (id) {
                                    newPromises.push(Task.findById(id).exec());
                                });

                                Promise.all(newPromises).then(function (tasks) {
                                    var finalPromises = [];

                                    tasks.forEach(function (task) {
                                        var userPromises = [];

                                        if (task.assignedUser !== "") {
                                            userPromises.push(User.findById(task.assignedUser).exec());
                                        }

                                        Promise.all(userPromises).then(function (users) {
                                            users.forEach(function (user) {
                                                user.pendingTasks.remove(task.id);
                                                finalPromises.push(user.save());
                                            });
                                        });

                                        task.completed = false;
                                        task.assignedUser = newUserId;
                                        task.assignedUserName = newUserName;
                                        finalPromises.push(task.save());
                                    });

                                    Promise.all(finalPromises).then(function () {
                                        return res.status(201).send({
                                            message: 'User Created Successfully',
                                            data: data
                                        });
                                    });
                                });
                            })
                            .catch(function (error) {
                                return res.status(500).send({
                                    message: '500 Error: Server Side',
                                    data: []
                                });
                            });
                        });
                    } else {
                        return res.status(404).send({
                            message: '404 Error: Duplicate Email',
                            data: []
                        });
                    }
                });
        } else {
            return res.status(404).send({
                message: 'Email Field Required',
                data: []
            });
        }
    });
    return router;
}