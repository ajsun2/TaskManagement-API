var User = require('../models/user.js');
var Task = require('../models/task.js');

module.exports = function(router) {
    var taskRoute = router.route('/tasks');

    taskRoute.get(async function(req, res) {
        try {
            const data = await User.find(JSON.parse(req.query.where || '{}'))
                .sort(JSON.parse(req.query.sort || '{}'))
                .select(JSON.parse(req.query.select || '{}'))
                .skip(parseInt(req.query.skip) || 0)
                .limit(parseInt(req.query.limit) || 0)
                .exec();
                res.status(200).send({
                    message: 'Tasks Retrieved Successfully',
                    data: req.query.count ? data.length : data
                });

        } catch (error) {
            res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    taskRoute.post(function(req, res) {
        var task = new Task();

        if('name' in req.body && req.body.name !== undefined) {
            task.name = req.body.name;
        } else {
            return res.status(404).send({
                message: '404 Error: Name Field Required',
                data: []
            });
        }

        task.description = ('description' in req.body && req.body.description !== undefined) ? req.body.description : "";

        if('deadline' in req.body && req.body.deadline !== undefined) {
            task.deadline = req.body.deadline;
        } else {
            return res.status(404).send({
                message: '404 Error: Deadline Field Required',
                data: []
            });
        }

        task.completed = ('completed' in req.body && req.body.completed !== undefined) ? req.body.completed : false;

        if('assignedUser' in req.body && req.body.assignedUser.length > 0 && req.body.assignedUser !== undefined) {
            User.findById(req.body.assignedUser).exec().then(function(user) {
                if(user == null) {
                    task.assignedUser = "";
                    task.assignedUserName = "unassigned";
                    task.save().then(function(data) {
                        return res.status(201).send({
                            message: 'Task Created Successfully',
                            data: data
                        });
                    })
                    .catch(function(error) {
                        return res.status(500).send({
                            message: '500 Error: Server Side',
                            data: []
                        });
                    });
                } else {
                    task.assignedUser = user.id;
                    task.assignedUserName = user.name;

                    task.save().then(function(data) {
                        if(!data.completed) {
                            user.pendingTasks.push(data.id);
                            user.save().then(function() {
                                return res.status(201).send({
                                    message: 'Task Created Successfully',
                                    data: data
                                });
                            });
                        } else {
                            return res.status(201).send({
                                message: 'Task Created Successfully',
                                data: data
                            });
                        }
                    })
                    .catch(function(error) {
                        return res.status(500).send({
                            message: '500 Error: Server Side',
                            data: []
                        });
                    });
                }
            });
        } else {
            task.assignedUser = "";
            task.assignedUserName = "unassigned";

            task.save()
            .then(function(data) {
                return res.status(201).send({
                    message: 'Task Created Successfully',
                    data: data
                });
            })
            .catch(function(error) {
                return res.status(500).send({
                    message: '500 Error: Server Side',
                    data: []
                });
            });
        }
    });

    return router;
}