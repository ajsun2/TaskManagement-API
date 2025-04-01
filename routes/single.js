const User = require('../models/user.js');
const Task = require('../models/task.js');

module.exports = function (router) {
    const singleTaskRoute = router.route('/tasks/:id');

    singleTaskRoute.get(async function (req, res) {
        try {
            const data = await Task.findById(req.params.id).exec();

            if (data === null) {
                return res.status(404).send({
                    message: '404 Error: No Match Found',
                    data: []
                });
            } else {
                return res.status(200).send({
                    message: 'Task Retrieved Successfully',
                    data: data
                });
            }
        } catch (error) {
            return res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    singleTaskRoute.put(async function (req, res) {
        try {
            const data = await Task.findById(req.params.id).exec();

            if (data === null) {
                return res.status(404).send({
                    message: '404 Error: No Match Found',
                    data: []
                });
            } else {
                var cpr = [];
                if(data.assignedUser != "" && !data.completed) {
                    User.findById(data.assignedUser).exec().then(function(user) {
                        user.pendingTasks.remove(data.id);
                        cpr.push(user.save());
                    });
                }
                Promise.all(cpr).then(function() {
                    var task = {};

                    if('name' in req.body && req.body.name !== undefined) {
                        task.name = req.body.name;
                    } else {
                        return res.status(404).send({
                            message: 'Name Field Required',
                            data: []
                        });
                    }

                    if('description' in req.body && req.body.description !== undefined) {
                        task.description = req.body.description;
                    } else {
                        task.description = "";
                    }

                    if('deadline' in req.body && req.body.deadline !== undefined) {
                        task.deadline = req.body.deadline;
                    } else {
                        return res.status(404).send({
                            message: 'Deadline Field Required',
                            data: []
                        });
                    }

                    if('completed' in req.body && req.body.completed !== undefined) {
                        task.completed = req.body.completed;
                    } else {
                        task.completed = false;
                    }

                    if('assignedUser' in req.body && req.body.assignedUser !== undefined && req.body.assignedUser.length > 0) {
                        User.findById(req.body.assignedUser).exec().then(function(user) {
                            if(user == null) {
                                task.assignedUser = "";
                                task.assignedUserName = "unassigned";

                                Task.findByIdAndUpdate(data.id, task, {new: true})
                                .then(function(data) {
                                    return res.status(200).send({
                                        message: 'Task Modified Successfully',
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

                                Task.findByIdAndUpdate(data.id, task, {new: true})
                                .then(function(data) {
                                    if(!data.completed) {
                                        user.pendingTasks.push(data.id);
                                        user.save().then(function() {
                                            return res.status(200).send({
                                                message: 'Task Modified Successfully',
                                                data: data
                                            });
                                        });
                                    } else {
                                        return res.status(200).send({
                                            message: 'Task Modified Successfully',
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

                        Task.findByIdAndUpdate(data.id, task, {new: true})
                        .then(function(data) {
                            return res.status(200).send({
                                message: 'Task Modified Successfully',
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
            }
        } catch (error) {
            return res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    singleTaskRoute.delete(async function (req, res) {
        try {
            const data = await Task.findById(req.params.id).exec();

            if (data === null) {
                return res.status(404).send({
                    message: '404: No Match Found',
                    data: []
                });
            } else {
                if(data.assignedUser != "" && !data.completed) {
                    User.findById(data.assignedUser).exec().then(function(user) {
                        if(user != null) {
                            user.pendingTasks.remove(data.id);
                            user.save().then(function() {
                                data.delete().then(function() {
                                    return res.status(200).send({
                                        message: 'Deleted Task Successfully',
                                        data: []
                                    });
                                });
                            }); 
                        } else {
                            data.delete().then(function() {
                                return res.status(200).send({
                                    message: 'Deleted Task Successfully',
                                    data: []
                                });
                            });
                        }
                    });
                } else {
                    data.delete().then(function() {
                        return res.status(200).send({
                            message: 'Task Deleted Successfully',
                            data: []
                        });
                    });
                }
            }
        } catch (error) {
            return res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    // User routes
    const singleUserRoute = router.route('/users/:id');

    singleUserRoute.get(async function (req, res) {
        try {
            const data = await User.findById(req.params.id).exec();

            if (data === null) {
                return res.status(404).send({
                    message: 'No User Found',
                    data: []
                });
            } else {
                return res.status(200).send({
                    message: 'Retrieved User Successfully',
                    data: data
                });
            }
        } catch (error) {
            return res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    singleUserRoute.put(async function (req, res) {
        try {
            const data = await User.findById(req.params.id).exec();

            if (data === null) {
                return res.status(404).send({
                    message: 'No User Found',
                    data: []
                });
            } else {
                var user = {};

                if('name' in req.body && req.body.name !== undefined) {
                    user.name = req.body.name;
                } else {
                    return res.status(404).send({
                        message: 'Name Field Required',
                        data: []
                    });
                }

                if('email' in req.body && req.body.email !== undefined) {
                    User.findOne({email: req.body.email}).exec()
                    .then(function(match) {
                        if(match == null || match.id == data.id) {
                            user.email = req.body.email;

                            Task
                            .updateMany({assignedUser: data.id}, {assignedUser: "", assignedUserName: "unassigned"})
                            .then(function() {
                                var promises = [];
                                if('pendingTasks' in req.body && req.body.pendingTasks !== undefined) {
                                    req.body.pendingTasks.forEach(function(id) {
                                        promises.push(Task.findById(id).exec());
                                    });
                                }
                                user.pendingTasks = [];
                                Promise.all(promises).then(function(values) {
                                    values.forEach(function(task) {
                                        if(task != null) {
                                            user.pendingTasks.push(task.id);
                                        }
                                    });
                                    User.findByIdAndUpdate(data.id, user, {new: true})
                                    .then(function(updated) {
                                        var newUserId = updated.id;
                                        var newUserName = updated.name;

                                        var newPromises = [];
                                        updated.pendingTasks.forEach(function(id) {
                                            newPromises.push(Task.findById(id).exec());
                                        });

                                        Promise.all(newPromises).then(function(tasks) {
                                            var finalPromises = [];

                                            tasks.forEach(function(task) {
                                                var userPromises = [];

                                                if(task.assignedUser !== "") {
                                                    userPromises.push(User.findById(task.assignedUser).exec());
                                                }

                                                Promise.all(userPromises).then(function(users) {
                                                    users.forEach(function(user) {
                                                        user.pendingTasks.remove(task.id);
                                                        finalPromises.push(user.save());
                                                    });
                                                });
                                                task.completed = false;
                                                task.assignedUser = newUserId;
                                                task.assignedUserName = newUserName;
                                                finalPromises.push(task.save());
                                            });

                                            Promise.all(finalPromises).then(function() {
                                                return res.status(200).send({
                                                    message: 'User Modified Successfully',
                                                    data: updated
                                                });
                                            });
                                        });
                                    })
                                    .catch(function(error) {
                                        return res.status(500).send({
                                            message: '500 Error: Server Side',
                                            data: []
                                        });
                                    });
                                });

                            });
                        } else {
                            return res.status(404).send({
                                message: '404: Duplicate Email',
                                data: []
                            });
                        }
                    });
                } else {
                    return res.status(404).send({
                        message: '404: Email Field Required',
                        data: []
                    });
                }
            }
        } catch (error) {
            return res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });

    singleUserRoute.delete(async function (req, res) {
        try {
            const data = await User.findById(req.params.id).exec();

            if (data === null) {
                return res.status(404).send({
                    message: 'No User Found',
                    data: []
                });
            } else {
                Task.updateMany({assignedUser: data.id}, {assignedUser: "", assignedUserName: "unassigned"})
                .then(function() {
                    data.delete().then(function() {
                        return res.status(200).send({
                            message: 'User Deleted Successfully',
                            data: []
                        });
                    });
                });
            }
        } catch (error) {
            return res.status(500).send({
                message: '500 Error: Server Side',
                data: []
            });
        }
    });
    return router;
};
