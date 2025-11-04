import bcrypt from "bcrypt";

export default async function handler(req, res) {
  // CORS 허용 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', 'https://hash-survey.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Preflight 요청에 대해 200 OK 응답
    res.status(200).end();
    return;
  }

    if (req.method === 'POST') {
        // 클라이언트에서 보낸 데이터를 받기
        const Pw = req.body.password;
        console.log("서버가 받은 데이터:", Pw);

        const result = await Promise.all([
            hashWithSHA256(Pw),
            hashWithArgon2(Pw),
            hashWithBcrypt(Pw)
        ]);
      
        // 받은 데이터를 기반으로 응답을 보냄
        res.status(200).json({
            success: true,
            message: `데이터가 정상 처리되었습니다`,
            receivedData: result
        });

        return;
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