# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 로그인 후 완성한 분석 결과 복원

분석과 조립 가이드 생성까지 완료한 뒤 저장 영역의 ‘로그인 후 저장하기’를 누르면, 같은 탭의 `sessionStorage`에 결과·옵션·작품 이름을 임시 보관합니다. 회원가입을 거치거나 로그인 화면을 새로고침해도 복원 요청을 유지합니다. 일반 로그인은 기존처럼 마이페이지로 이동합니다.

복원 후에도 자동으로 계정에 저장하지 않습니다. 사용자가 ‘내 작품으로 저장’을 눌러야 서버에 저장합니다. 저장 실패 시 임시 결과를 유지하고, 성공하면 해당 초안을 삭제합니다. 복원한 결과를 초기화하거나 분석 조건을 바꿀 때도 해당 초안을 정리합니다.

- 보관 시간: 30분. 복원 시 만료·형식을 검사하고 만료되거나 잘못된 데이터는 정리합니다.
- 비회원 작업은 로그인 후 복원하며, 기존 회원의 세션 만료로 보관한 작업은 같은 회원으로 로그인해야 복원합니다. 다른 계정에는 내용이 표시되지 않습니다.
- 원본 업로드 파일·미리보기의 임시 URL·비밀번호는 보관하지 않습니다. 실제 이미지의 재분석에는 파일을 다시 선택해야 합니다.
- 브라우저가 저장 공간을 차단하거나 용량이 부족하면 로그인 화면으로 이동하지 않고 현재 결과를 유지하며 안내합니다.
- 임시 보관은 영구 저장·백업이 아닙니다. 일반적인 별도 탭에는 공유하지 않지만, 브라우저의 탭 복제 기능은 임시 저장소까지 복사할 수 있습니다.
- 복원 목적지는 `/analyze?resume=1`로 고정하여 외부 주소로 이동하지 않습니다.

관련 파일은 `src/utils/pendingAnalysis.js`, `src/pages/AuthPage.jsx`, `src/pages/Analyze.jsx`, `src/components/works/SaveWorkForm.jsx`입니다. 보관·검증·정리는 유틸리티가, 화면 복원은 분석 화면이, 로그인 이동과 저장은 각 화면이 담당합니다.

검증 명령:

```sh
node --test tests/pendingAnalysis.test.mjs
npm run build
```
