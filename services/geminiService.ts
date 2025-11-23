import { GoogleGenAI } from "@google/genai";
import { Vehicle, VehicleStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLogisticsReport = async (vehicles: Vehicle[]) => {
  try {
    const completedVehicles = vehicles.filter(v => v.status === VehicleStatus.COMPLETED);
    const activeVehicles = vehicles.filter(v => v.status !== VehicleStatus.COMPLETED);

    const dataSummary = JSON.stringify({
      total_vehicles_today: vehicles.length,
      completed_count: completedVehicles.length,
      active_queue: activeVehicles.length,
      sample_completed: completedVehicles.slice(-5).map(v => ({
        plate: v.licensePlate,
        products: v.productCount,
        duration_ms: new Date(v.exitTime!).getTime() - new Date(v.arrivalTime).getTime()
      }))
    });

    const prompt = `
      Sen kıdemli bir Depo Lojistik Müdürüsün. 5 rampalı bir deponun bugünkü operasyonlarını temsil eden aşağıdaki JSON verilerini analiz et.
      
      Veri: ${dataSummary}

      Kısa, profesyonel bir operasyon raporu hazırla (maksimum 150 kelime). Dil Türkçe olsun.
      Şunlara odaklan:
      1. Verimlilik ve iş hacmi.
      2. Kuyruk ve tamamlanan araç oranına göre darboğaz analizi.
      3. Saha yöneticisi için bir spesifik öneri.
      
      Çıktıyı Markdown formatında ver. Önemli metrikleri kalın yaz.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "Şu anda AI raporu oluşturulamıyor. Lütfen daha sonra tekrar deneyin.";
  }
};