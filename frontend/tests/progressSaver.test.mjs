import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as tick} from 'node:timers/promises';
import {createProgressSaver} from '../src/utils/progressSaver.js';
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}

test('처음 열 때 저장 요청을 보내지 않고 기존 위치만 복원한다',()=>{
 let calls=0;const saver=createProgressSaver(()=>{calls++;});
 assert.equal(saver.getSnapshot().status,'idle');assert.equal(calls,0);
 const restored=createProgressSaver(()=>{calls++;},{stepIndex:3,savedAt:'saved-before'});
 assert.equal(restored.getSnapshot().status,'restored');assert.equal(restored.getSnapshot().stepIndex,3);assert.equal(calls,0);
});
test('요청을 직렬화하고 대기 중 최신 선택만 보내 완료 상태를 조기에 표시하지 않는다',async()=>{
 const first=deferred(),last=deferred();const calls=[];
 const saver=createProgressSaver(index=>{calls.push(index);return calls.length===1?first.promise:last.promise;});
 saver.select(1);saver.select(2);saver.select(5);assert.deepEqual(calls,[1]);
 first.resolve({stepIndex:1,savedAt:'first'});await tick();assert.deepEqual(calls,[1,5]);assert.equal(saver.getSnapshot().status,'saving');
 last.resolve({stepIndex:5,savedAt:'last'});await tick();assert.equal(saver.getSnapshot().status,'saved');assert.equal(saver.getSnapshot().stepIndex,5);assert.equal(saver.getSnapshot().savedAt,'last');
});
test('실패 시 최신 선택을 유지하고 중복 재시도를 보내지 않는다',async()=>{
 const first=deferred(),retry=deferred();const calls=[];
 const saver=createProgressSaver(index=>{calls.push(index);return calls.length===1?first.promise:retry.promise;});
 saver.select(1);saver.select(4);first.reject({status:500});await tick();
 assert.equal(saver.getSnapshot().status,'error');assert.equal(saver.getSnapshot().stepIndex,4);
 saver.retry();saver.retry();assert.deepEqual(calls,[1,4]);retry.resolve({stepIndex:4,savedAt:'retry'});await tick();assert.equal(saver.getSnapshot().status,'saved');
});
test('오류 후 새 단계를 선택하면 최신 위치를 저장한다',async()=>{
 const calls=[];const saver=createProgressSaver(async index=>{calls.push(index);if(calls.length===1)throw new Error('offline');return {stepIndex:index,savedAt:'ok'};});
 saver.select(2);await tick();assert.equal(saver.getSnapshot().status,'error');saver.select(3);await tick();assert.deepEqual(calls,[2,3]);assert.equal(saver.getSnapshot().status,'saved');assert.equal(saver.getSnapshot().error,null);
});
test('뒤로 이동과 처음부터 보기는 최대 단계가 아닌 마지막 선택을 저장한다',async()=>{
 const first=deferred();const calls=[];const saver=createProgressSaver(index=>{calls.push(index);return calls.length===1?first.promise:Promise.resolve({stepIndex:index,savedAt:'zero'});});
 saver.select(5);saver.select(2);saver.select(0);first.resolve({stepIndex:5,savedAt:'five'});await tick();assert.deepEqual(calls,[5,0]);assert.equal(saver.getSnapshot().stepIndex,0);
});
test('화면 구독 해제 후에도 대기 중인 최신 저장은 처리한다',async()=>{
 const first=deferred();const calls=[];const saver=createProgressSaver(index=>{calls.push(index);return calls.length===1?first.promise:Promise.resolve({stepIndex:index,savedAt:'done'});});
 let notifications=0;const unsubscribe=saver.subscribe(()=>notifications++);saver.select(1);saver.select(3);unsubscribe();const before=notifications;first.resolve({stepIndex:1,savedAt:'one'});await tick();assert.deepEqual(calls,[1,3]);assert.equal(notifications,before);assert.equal(saver.getSnapshot().status,'saved');
});
test('유효하지 않은 선택과 대기 요청 없는 재시도는 저장하지 않는다',()=>{
 let calls=0;const saver=createProgressSaver(()=>{calls++;});for(const value of [-1,1.5,NaN,'2'])saver.select(value);saver.retry();assert.equal(calls,0);assert.equal(saver.getSnapshot().status,'idle');
});
