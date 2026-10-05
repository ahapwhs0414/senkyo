"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="login">
      <div className="card">
        <h1>잠시 연결할 수 없어요</h1>
        <p>
          여행 정보를 불러오지 못했습니다. 연결과 초기 데이터 설정을 확인한 뒤
          다시 시도해주세요.
        </p>
        <button className="primary" onClick={reset}>
          다시 시도
        </button>{" "}
        <a className="link" href="/login">
          로그인 화면
        </a>
      </div>
    </main>
  );
}
