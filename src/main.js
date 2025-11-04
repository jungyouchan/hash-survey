import bcrypt from "bcryptjs";

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("button");
  let doneTimeout = null, resetTimeout = null;

  if (btn) {
    btn.addEventListener("click", async function () {
      const Id = document.getElementById("inputId").value;
      const Pw = document.getElementById("inputPassword").value;

      if (!Pw) {
        alert("비밀번호를 모두 입력해주세요.");
        return;
      }

      const runClass = "btn--running";
      const doneClass = "btn--done";
      const slowDuration = 4000; // 클릭 후 천천히 채우는 시간
      const fastDuration = 500;  // submit 완료 후 빠르게 채우는 시간
      const resetDuration = 1500;

      this.disabled = true;
      this.classList.add(runClass);

      const progressFill = this.querySelector(".btn__progress-fill");
      const totalLength = progressFill.getTotalLength();

      // 1. 원 초기화
      progressFill.style.transition = "none";
      progressFill.style.strokeDashoffset = totalLength;
      
      // 2. 천천히 채우기 시작
      requestAnimationFrame(() => {
        progressFill.style.transition = `stroke-dashoffset ${slowDuration}ms linear`;
        progressFill.style.strokeDashoffset = 0;
      });
      
      // 3. submit 실행
      const result = await submit(Pw);
      
      // 4. submit 완료 → 빠르게 100% 채움
      progressFill.style.transition = `stroke-dashoffset ${fastDuration}ms linear`;
      progressFill.style.strokeDashoffset = 0;
      
      // 5. fastDuration 후 done 상태 + 차트 그리기
      setTimeout(() => {
        this.classList.remove(runClass);
        this.classList.add(doneClass);

        drawHashTimeChart(result[0].time_ms, result[1].time_ms, result[2].time_ms);

        // 6. 버튼 리셋
        setTimeout(() => {
          this.disabled = false;
          this.classList.remove(doneClass);
          progressFill.style.transition = "none";
          progressFill.style.strokeDashoffset = totalLength;
        }, resetDuration);

      }, fastDuration);
    });
  }
});

async function submit(Pw) {
  const Id = document.getElementById("inputId").value;

  try {
    const result = await fetch("https://hash-survey.vercel.app/api/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: Pw})
    })

    result = await result.json();

    console.log("해싱 완료:", result);

    const response = await fetch("https://encryption-pink.vercel.app/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: Id,
        passwordHashes: {
          SHA256: result[0].time_ms,
          Argon2: result[1].time_ms,
          Bcrypt: result[2].time_ms
        }
      })
    })
      .then(res => res.json())
      .then(data => console.log("서버 응답:", data))
      .catch(err => console.error("에러:", err))

    return result;

  } catch (err) {
    console.error("해싱 오류:", err);
  }
}

async function hashWithSHA256(rawPassword) {
  const start = performance.now();
  const msgUint8 = new TextEncoder().encode(rawPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  const time_ms = performance.now() - start;
  return { hash: hashHex, time_ms, algorithm: "SHA-256" };
}

async function hashWithArgon2(rawPassword) {
  const start = performance.now();
  const res = await argon2.hash({
    pass: rawPassword,
    salt: "somesalt",
    time: 2,
    mem: 65536,
    parallelism: 1,
    wasmFile: "./argon2.wasm", // public/argon2.wasm 경로
    type: argon2.ArgonType.Argon2id,
  });
  const time_ms = performance.now() - start;
  return { hash: res.hashHex, time_ms, algorithm: "argon2" };
}

async function hashWithBcrypt(rawPassword) {
  const start = performance.now();
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(rawPassword, salt);
  const time_ms = performance.now() - start;
  return { hash, time_ms, algorithm: "bcrypt" };
}

function drawHashTimeChart(SHA256, Argon2, Bcrypt) {
  const ctx = document.getElementById('hashTimeChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['SHA-256', 'Argon2', 'Bcrypt'],
      datasets: [{
        label: '평균 해시 생성 시간 (ms)',
        data: [SHA256, Argon2, Bcrypt],
        backgroundColor: ['#4caf50','#ff9800','#2196f3']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // true면 캔버스 비율 고정
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '시간 (ms)' }
        }
      }
    }
  });
}
