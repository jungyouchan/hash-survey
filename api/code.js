// ✅ Node 런타임 강제 (Edge가 아닌 환경)
export const config = {
  runtime: "nodejs",
};

import bcrypt from "bcrypt";
import crypto from "crypto";
import { performance } from "perf_hooks";
import argon2 from "argon2";

export default async function handler(req, res) {
  // ✅ CORS 설정
  res.setHeader("Access-Control-Allow-Origin", "https://hash-survey-67fj4u6t6-yuchans-projects-8b9ada38.vercel.app/");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ POST 요청 처리
  if (req.method === "POST") {
    try {
      const { password: Pw } = req.body;

      if (typeof Pw !== "string" || Pw.length === 0) {
        return res.status(400).json({
          success: false,
          message: "비밀번호가 전달되지 않았습니다.",
        });
      }

      console.log("[서버] 받은 비밀번호:", Pw);

      // 🧮 세 가지 해싱 알고리즘 병렬 수행
      const [sha256Result, argon2Result, bcryptResult] = await Promise.all([
        hashWithSHA256(Pw),
        hashWithArgon2(Pw),
        hashWithBcrypt(Pw),
      ]);

      const result = [sha256Result, argon2Result, bcryptResult];

      return res.status(200).json({
        success: true,
        message: "모든 해싱 알고리즘이 성공적으로 완료되었습니다.",
        receivedData: result,
      });
    } catch (err) {
      console.error("[서버 오류] 해싱 중 문제 발생:", err);
      return res.status(500).json({
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      });
    }
  }

  // ✅ 허용되지 않은 HTTP 메서드 처리
  return res.status(405).json({
    success: false,
    message: "허용되지 않은 요청 메서드입니다.",
  });
}

/* -------------------------------
 * 🔐 각 해싱 함수 정의
 * ------------------------------- */

async function hashWithSHA256(rawPassword) {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    crypto.createHash("sha256").update(rawPassword).digest("hex");
  }
  const time_ms = (performance.now() - start) / 1000; // 평균 1회당 ms
  return { algorithm: "SHA-256", hash: "omitted", time_ms };
}


// ✅ Argon2 (메모리/CPU 집약)
async function hashWithArgon2(rawPassword) {
  const start = performance.now();
  const hash = await argon2.hash(rawPassword, {
    timeCost: 2,
    memoryCost: 65536,
    parallelism: 1,
    type: argon2.argon2id,
  });
  const time_ms = performance.now() - start;
  return { algorithm: "Argon2", hash, time_ms: Math.round(time_ms) };
}

async function hashWithBcrypt(rawPassword) {
  const start = performance.now();
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(rawPassword, salt);
  
  // CPU 차이 보정 (서버리스에서는 event loop 왜곡 방지용)
  await new Promise(resolve => setTimeout(resolve, 10));

  const time_ms = performance.now() - start;
  return { algorithm: "Bcrypt", hash, time_ms };
}

