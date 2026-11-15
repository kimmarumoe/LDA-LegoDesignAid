import test from 'node:test';
import assert from 'node:assert/strict';
import { PENDING_ANALYSIS_KEY, PENDING_ANALYSIS_TTL, savePendingAnalysis, readPendingAnalysis, clearPendingAnalysis } from '../src/utils/pendingAnalysis.js';
import { SAMPLE_GUIDE } from '../src/sample/sampleGuide.js';

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
const values = { title: '나의 작품', analysis: SAMPLE_GUIDE, steps: SAMPLE_GUIDE.steps, options: {gridSize:'16x16',colorLimit:16}, useSample: true, sampleId: 'smile-16' };

test('비회원 초안은 로그인 후 반복해서 읽을 수 있고 결과와 옵션·이름을 유지한다', () => {
  const options = {storage: storage(), now: 1000};
  const saved = savePendingAnalysis(values, options);
  assert.equal(readPendingAnalysis(null, options).status, 'login-required');
  assert.deepEqual(readPendingAnalysis(1, options), {status:'ready',draft:saved});
  assert.deepEqual(readPendingAnalysis(1, options), {status:'ready',draft:saved});
  assert.equal(saved.title, values.title);
  assert.deepEqual(saved.steps, values.steps);
  assert.deepEqual(saved.options, values.options);
});
test('회원 초안은 본인만 복원하고 다른 계정에는 결과를 반환하지 않는다', () => {
  const options = {storage:storage(),now:1000};
  savePendingAnalysis({...values,ownerId:7},options);
  assert.deepEqual(readPendingAnalysis(8,options),{status:'different-member'});
  assert.equal(readPendingAnalysis(7,options).status,'ready');
});
test('30분 경계와 미래 시각의 초안은 만료 처리한다', () => {
  const options = {storage:storage(),now:1000};
  savePendingAnalysis(values,options);
  assert.equal(readPendingAnalysis(1,{...options,now:1000+PENDING_ANALYSIS_TTL-1}).status,'ready');
  assert.deepEqual(readPendingAnalysis(1,{...options,now:1000+PENDING_ANALYSIS_TTL}),{status:'expired'});
  assert.equal(readPendingAnalysis(1,{...options,now:999}).status,'expired');
});
test('미완성 결과는 기록하지 않는다', () => {
  const options = {storage:storage()};
  for(const bad of [{...values,steps:[]},{...values,analysis:{}},{...values,steps:[{bricks:[]}]},{...values,title:'가'.repeat(81)}]) {
    assert.throws(()=>savePendingAnalysis(bad,options));
  }
  assert.deepEqual(readPendingAnalysis(1,options),{status:'missing'});
});
test('손상된 JSON과 잘못된 버전·크기를 안전하게 처리한다', () => {
  const options = {storage:storage(),now:1000};
  options.storage.setItem(PENDING_ANALYSIS_KEY,'{broken');
  assert.equal(readPendingAnalysis(1,options).status,'invalid');
  const draft=savePendingAnalysis(values,options);
  for(const invalid of [{...draft,version:2},{...draft,analysis:{...draft.analysis,meta:{width:100000,height:16}}}]) {
    options.storage.setItem(PENDING_ANALYSIS_KEY,JSON.stringify(invalid));
    assert.equal(readPendingAnalysis(1,options).status,'invalid');
  }
});
test('저장 공간 부족은 실패를 알리고 읽기 차단도 화면을 중단하지 않는다', () => {
  const blocked={setItem(){throw new Error('quota');},getItem(){throw new Error('blocked');},removeItem(){throw new Error('blocked');}};
  assert.throws(()=>savePendingAnalysis(values,{storage:blocked}),/이동하지 않았습니다/);
  assert.deepEqual(readPendingAnalysis(1,{storage:blocked}),{status:'unavailable'});
  assert.equal(clearPendingAnalysis(undefined,{storage:blocked}),false);
});
test('원본 파일·비밀번호·예상하지 않은 필드는 기록하지 않는다', () => {
  const options={storage:storage(),now:1000};
  savePendingAnalysis({...values,password:'secret',selectedFile:{name:'private.png'},previewUrl:'blob:private'},options);
  const raw=options.storage.getItem(PENDING_ANALYSIS_KEY);
  for(const key of ['password','selectedFile','previewUrl','secret','private.png']) assert.equal(raw.includes(key),false);
});
test('저장 성공한 초안만 지워 새로운 초안을 실수로 삭제하지 않는다', () => {
  const options={storage:storage(),now:1000};
  const first=savePendingAnalysis(values,options);
  const second=savePendingAnalysis({...values,title:'새 작업'},options);
  assert.equal(clearPendingAnalysis(first.id,options),true);
  assert.equal(readPendingAnalysis(1,options).draft.id,second.id);
  assert.equal(clearPendingAnalysis(second.id,options),true);
  assert.equal(readPendingAnalysis(1,options).status,'missing');
});
test('초기화는 현재 탭의 초안을 삭제한다', () => {
  const options={storage:storage(),now:1000};
  savePendingAnalysis(values,options);
  assert.equal(clearPendingAnalysis(undefined,options),true);
  assert.deepEqual(readPendingAnalysis(1,options),{status:'missing'});
});
