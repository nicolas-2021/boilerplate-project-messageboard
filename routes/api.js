'use strict';
let mongodb = require('mongodb');
let mongoose = require('mongoose');
module.exports = function (app) {
  let uri = 'mongodb+srv://nicolasmartinamuedo1:' + process.env.PW + '@cluster0.oryegl1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  let db = mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  if (!db){
    console.log('Can not connect to database.')
  }else{
    console.log('Success on connect to database.')
  }

  let replySchema = new mongoose.Schema({
    text: {type: String, required: true},
    delete_password: {type: String, required: true},
    created_on: {type: Date, required: true},
    reported: {type: Boolean, required: true}
  })

  let threadSchema = new mongoose.Schema({
    text: {type: String, required: true},
    delete_password: {type: String, required: true},
    board: {type: String, required: true},
    created_on: {type: Date, required: true},
    bumped_on: {type: Date, required: true},
    reported: {type: Boolean, required: true},
    replies: [replySchema]
  })

  let Reply = mongoose.model('Reply', replySchema);
  let Thread = mongoose.model('Thread', threadSchema);

  app.post('/api/threads/:board',async(req,res)=>{
    let newThread = new Thread(req.body);
    if (!newThread.board | newThread.board === ''){
      newThread.board = req.params.board;
    }
    newThread.created_on = new Date().toUTCString();
    newThread.bumped_on = new Date().toUTCString();
    newThread.reported = false;
    newThread.replies = []
    let newSavedThread = await newThread.save();
    console.log(newSavedThread);
      if(newSavedThread){
        return res.redirect('/b/'+newSavedThread.board+'/'+newSavedThread.id)
      }
  })
  
  app.post('/api/replies/:board', async(req,res)=>{
    let newReplies = new Reply(req.body);
    newReplies.created_on = new Date().toUTCString();
    newReplies.reported = false;
    newReplies.save(); //agregado -----
    let newThread = await Thread.findByIdAndUpdate(req.body.thread_id,
      {$push: {replies: newReplies}, bumped_on: new Date().toUTCString()},
      {new: true}
    );
    if (!newThread){
      res.send('Error')
    }else{
      res.redirect('/b/'+newThread.board+'/'+newThread.id+'?new_reply_id='+newReplies.id)
    }
    
  });
  //app.route('/api/threads/:board');
    
  //app.route('/api/replies/:board');

  app.get('/api/threads/:board',async(req,res)=>{
    let arrayOfThreads = await Thread.find({board:req.params.board})
    .sort({bumped_on:'desc'})
    .limit(10)
    .select('-delete_password -reported')
    .lean()
    .exec();
    if (!arrayOfThreads){
      res.send('Error')
    }else{
      arrayOfThreads.forEach((thread)=>{
        thread['replycount'] = thread.replies.length;

        thread.replies.sort((reply1,reply2)=>{
          return reply2.created_on - reply1.created_on
        })
        thread.replies = thread.replies.slice(0,3)

        thread.replies.forEach((reply)=>{
          reply.delete_password = undefined;
          reply.reported = undefined;
        })
      })
    }
    return res.json(arrayOfThreads)
  })

  app.get('/api/replies/:board',async(req,res)=>{
   let thread = await Thread.findById(req.query.thread_id);
   if (!thread){
    res.send('Error')
   }else{
      thread.delete_password = undefined;
      thread.reported = undefined;

      thread['replycount'] = thread.replies.length;

      thread.replies.sort((reply1,reply2)=>{
        return reply2.created_on - reply1.created_on
      })


      thread.replies.forEach((reply)=>{
        reply.delete_password = undefined;
        reply.reported = undefined;
      })
   }
   return res.json(thread);
  });

  app.delete('/api/threads/:board',async(req,res)=>{
    let threadToDelete = await Thread.findById(req.body.thread_id);
    
    if (!threadToDelete){
      return res.send('Error')
    }else{
      if (threadToDelete.delete_password === req.body.delete_password){
       let deletedThread = await Thread.findByIdAndDelete(req.body.thread_id).exec();
       if (!deletedThread){
        return res.send('Error');
       }else{
        return res.send('success');
       }
      }else{
        return res.send('incorrect password');
      }
    }
  });

  app.delete('/api/replies/:board', async(req,res)=>{
   let threadToUpdate = await Thread.findById(req.body.thread_id).exec();
   console.log(threadToUpdate);
   if (!threadToUpdate){
    return res.json('Thread not found')
   }else{
      let i;
      for(i=0; i<threadToUpdate.replies.length; i++){
        if (threadToUpdate.replies[i].id === req.body.reply_id){
          if (threadToUpdate.replies[i].delete_password === req.body.delete_password){
            threadToUpdate.replies[i].text = '[deleted]';
          }else{
            return res.send('incorrect password');
          }
        }
      }
      let savedThreadUpd = threadToUpdate.save();
      if (!savedThreadUpd){
        return res.send('Error')
      }else{
        return res.send('success');
      }
   }
  });

  app.put('/api/threads/:board', async(req,res)=>{
    let updatedThread = await Thread.findByIdAndUpdate(req.body.thread_id,
      {reported: true},
      {new: true}
    );
    if (!updatedThread){
      return res.send('Error')
    }else{
      return res.send('reported');
    }
  });

  app.put('/api/replies/:board', async(req, res)=>{
    let threadToUpdate = await Thread.findById(req.body.thread_id).exec();
   console.log(threadToUpdate);
   if (!threadToUpdate){
    return res.json('Thread not found')
   }else{
      let i;
      for(i=0; i<threadToUpdate.replies.length; i++){
        if (threadToUpdate.replies[i].id === req.body.reply_id){
          threadToUpdate.replies[i].reported = true;
        }
      }
      let savedThreadUpd = threadToUpdate.save();
      if (!savedThreadUpd){
        return res.send('Error')
      }else{
         return res.send('reported');
      }
   }
  });

};
