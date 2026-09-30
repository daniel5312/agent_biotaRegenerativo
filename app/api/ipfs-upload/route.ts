// app/api/ipfs-upload/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(request: Request) {
  try {
    // 1. Extraer el archivo (File) empaquetado en el FormData HTTP original (Frontend)
    const formDataClient = await request.formData();
    const file = formDataClient.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // 2. Empaquetarlo en un FormData de Node.js (form-data)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const formDataNode = new FormData();
    formDataNode.append("file", buffer, {
      filename: file.name,
      contentType: file.type,
    });

    // 3. Metadata Oficial IPFS opcional (para trazabilidad en Pinata Cloud)
    const pinataMetadata = JSON.stringify({
      name: `Biota_Evidencia_${Date.now()}`,
    });
    formDataNode.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formDataNode.append("pinataOptions", pinataOptions);

    // 4. EL ENVÍO SEGURO A PINATA usando tu JWT en .env
    const resolve = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formDataNode,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formDataNode.getBoundary()}`,
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    // 5. Devolver IPFS Hash ("CID") al Frontend
    const cid = resolve.data.IpfsHash;
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || "ipfs.io";

    return NextResponse.json({
      ipfsHash: cid,
      ipfsUrl: `https://${gateway}/ipfs/${cid}`,
      ipfsUri: `ipfs://${cid}`
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Pinata API Multipart] Error interno de subida:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Falló la operación PIN hacia el protocolo IPFS." },
      { status: 500 }
    );
  }
}
