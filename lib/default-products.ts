import { ProductInput } from "@/lib/types";

export const defaultProducts: ProductInput[] = [
  {
    slug: "attendance-management-system",
    name: "Attendance Management System",
    cat: "software",
    description: "Cloud attendance with GEO tracking, mobile app and alerts.",
    unit: "year",
    price: 15000,
    origPrice: 18000,
    gstRate: 18,
    inStock: true,
    enabled: true,
    isNew: false,
    offer: "17% OFF - Launch Offer"
  },
  {
    slug: "ai-facial-recognition-biometric",
    name: "AI Facial Recognition Biometric",
    cat: "hardware",
    description: "Face + RF + PIN access with instant alerts.",
    unit: "unit",
    price: 45000,
    origPrice: 52000,
    gstRate: 18,
    inStock: true,
    enabled: true,
    isNew: true,
    offer: "13% OFF"
  },
  {
    slug: "smart-campus-iot-hub",
    name: "Smart Campus IoT Hub",
    cat: "iot",
    description: "Central IoT hub for campus automation and dashboards.",
    unit: "site",
    price: 35000,
    origPrice: 40000,
    gstRate: 18,
    inStock: true,
    enabled: true,
    isNew: true,
    offer: "12% OFF"
  }
];
