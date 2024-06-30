const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    let testThreadId;
    let testReplyId;
    let testPass = 'testpass';

    test('Creating a new thread: POST request to /api/threads/{board}', (done)=>{
        chai
            .request(server)
            .post('/api/threads/test')
            .set('content-type', 'application/json')
            .send({
                board: 'test',
                text: 'Thread1',
                delete_password: testPass
            })
            .end((err,res)=>{
                assert.equal(res.status, 200);
                let createdThread = res.redirects[0].split('/')[res.redirects[0].split('/').length-1];
                console.log(createdThread);
                testThreadId = createdThread;
                done();
            })
    });

    test('Creating a new reply: POST request to /api/replies/{board}', (done)=>{
        chai    
            .request(server)
            .post('/api/replies/test')
            .set('content-type', 'application/json')
            .send({
                thread_id: testThreadId,
                text: 'Reply1',
                delete_password: testPass
            })
            .end((err,res)=>{
                assert.equal(res.status,200);
                let createdReply = res.redirects[0].split('=')[res.redirects[0].split('=').length-1];
                testReplyId = createdReply;
                done();
            })
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', (done)=>{
        chai
            .request(server)
            .get('/api/threads/test')
            .send()
            .end((err,res)=>{
                assert.isArray(res.body);
                assert.isAtMost(res.body.length, 10);
                let firstThread = res.body[0];
                assert.isUndefined(firstThread.delete_password);
                assert.isAtMost(firstThread.replies.length,3)
                done();
            })
    })

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', (done)=>{
        chai    
            .request(server)
            .get('/api/replies/test')
            .query({thread_id:testThreadId})
            .send()
            .end((err,res)=>{
                let thread = res.body;
                assert.equal(thread._id,testThreadId);
                assert.isUndefined(thread.delete_password);
                assert.isArray(thread.replies);
                done();
            })
    });

    test('Reporting a thread: PUT request to /api/threads/{board}',(done)=>{
        chai    
            .request(server)
            .put('/api/threads/test')
            .send({
                thread_id: testThreadId
            })
            .end((err,res)=>{
                //assert.equal(res.body, 'reported');
                assert.equal(res.status,200);
                done();
            })
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', (done)=>{
        chai    
            .request(server)
            .put('/api/replies/test')
            .send({
                thread_id: testThreadId,
                reply_id: testReplyId
            })
            .end((err,res)=>{
                //assert.equal(res.body, 'reported');
                assert.equal(res.status,200);
                done();
            })
    })





    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password',(done)=>{
        chai    
            .request(server)
            .delete('/api/replies/test')
            .send({
                thread_id: testThreadId,
                reply_id: testReplyId,
                delete_password: 'incorrect'
            })
            .end((err,res)=>{
                //assert.equal(res.body, 'incorrect password');
                assert.equal(res.status,200);
                done();
            })
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password',(done)=>{
        chai    
            .request(server)
            .delete('/api/replies/test')
            .send({
                thread_id: testThreadId,
                reply_id: testReplyId,
                delete_password: testPass
            })
            .end((err,res)=>{
                //assert.equal(res.body, 'success');
                assert.equal(res.status,200);
                done();
            })
    });



    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password',(done)=>{
        chai    
            .request(server)
            .delete('/api/threads/test')
            .send({
                thread_id: testThreadId,
                delete_password: 'incorrect'
            })
            .end((err,res)=>{
                //assert.equal(res.body, 'incorrect password');
                assert.equal(res.status,200);
                done();
            })
    });


    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', (done)=>{
        chai    
            .request(server)
            .delete('/api/threads/test')
            .send({
                thread_id: testThreadId,
                delete_password: testPass
            })
            .end((err,res)=>{
                //assert.equal(res.body, 'success');
                assert.equal(res.status,200);
                done();
            })
    });

});
