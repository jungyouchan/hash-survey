// Node 런타임 강제 (Edge가 아닌 환경)
export const config = {
  runtime: "nodejs20.x",
};

import bcrypt from "bcrypt";
import crypto from "crypto";
import { performance } from "perf_hooks";
import argon2 from "argon2";

export default async function handler(req, res) {
  // ✅ CORS 설정
  res.setHeader("Access-Control-Allow-Origin", "https://hash-survey.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const { password: Pw } = req.body;
      if (!Pw) return res.status(400).json({ success: false, message: "비밀번호가 없습니다." });

      console.log("서버에서 받은 비밀번호:", Pw);

      // 🧮 세 알고리즘 실행 (병렬)
      const result = await Promise.all([
        hashWithSHA256(Pw),
        hashWithArgon2(Pw),
        hashWithBcrypt(Pw)
      ]);

      return res.status(200).json({
        success: true,
        message: "해싱 완료",
        receivedData: result
      });
    } catch (err) {
      console.error("서버 해싱 오류:", err);
      return res.status(500).json({ success: false, message: "서버 내부 오류" });
    }
  }

  res.status(405).json({ success: false, message: "허용되지 않은 메서드" });
}

// ✅ SHA-256
async function hashWithSHA256(rawPassword) {
  const start = performance.now();
  const hash = crypto.createHash("sha256").update(rawPassword).digest("hex");
  const time_ms = performance.now() - start;
  return { algorithm: "SHA-256", hash, time_ms };
}

// ✅ Argon2
async function hashWithArgon2(rawPassword) {
  const start = performance.now();
  const hash = await argon2.hash(rawPassword, { timeCost: 2, memoryCost: 65536 });
  const time_ms = performance.now() - start;
  return { algorithm: "Argon2", hash, time_ms };
}

// ✅ Bcrypt (Node 네이티브)
async function hashWithBcrypt(rawPassword) {
  const start = performance.now();
  const salt = await bcrypt.genSalt(12); // rounds=12
  const hash = await bcrypt.hash(rawPassword, salt);
  const time_ms = performance.now() - start;
  return { algorithm: "Bcrypt", hash, time_ms };
}
