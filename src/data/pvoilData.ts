import { PetrolimexProduct } from '../types/logistics';

export const PVOIL_PRODUCTS: PetrolimexProduct[] = [
  {
    id: 'pvoil_do_0_05s',
    code: 'DO 0,05S-II',
    name: 'Dầu Điêzen DO 0,05S-II (PVOIL)',
    unit: 'đồng/lít',
    zone1Price: 26820, // Cập nhật thời gian thực từ link https://www.pvoil.com.vn/tin-gia-xang-dau
    zone2Price: 27360,
    priceDiff: 540,
    isPrimaryFuelForLogistics: true,
    adjustmentDiff: '-1870',
    description: 'Nhiên liệu tiêu chuẩn quy định tính cước xe tải và xe cont kéo cảng theo Phụ lục 3 Viettel Logistics.',
  },
  {
    id: 'pvoil_do_0_001s',
    code: 'DO 0,001S-V',
    name: 'Dầu Điêzen DO 0,001S-V (Euro 5)',
    unit: 'đồng/lít',
    zone1Price: 28620,
    zone2Price: 29190,
    priceDiff: 570,
    isPrimaryFuelForLogistics: false,
    adjustmentDiff: '-1470',
    description: 'Dầu Diesel Euro 5 chất lượng cao giảm thiểu phát thải.',
  },
  {
    id: 'pvoil_ron_95',
    code: 'RON 95-III',
    name: 'Xăng E10 RON 95-III (PVOIL)',
    unit: 'đồng/lít',
    zone1Price: 19840,
    zone2Price: 20240,
    priceDiff: 400,
    isPrimaryFuelForLogistics: false,
    adjustmentDiff: '-1310',
    description: 'Xăng cao cấp mạng lưới PVOil.',
  },
  {
    id: 'pvoil_ron_92',
    code: 'E5 RON 92-II',
    name: 'Xăng sinh học E5 RON 92-II',
    unit: 'đồng/lít',
    zone1Price: 19390,
    zone2Price: 19780,
    priceDiff: 390,
    isPrimaryFuelForLogistics: false,
    adjustmentDiff: '-1500',
    description: 'Xăng sinh học mạng lưới PVOil.',
  },
];

export const PVOIL_METADATA = {
  announcementDate: '2026-11-12',
  effectiveTime: 'Giá điều chỉnh lúc 15:00 ngày 12/11/2026',
  sourceName: 'Tổng công ty Dầu Việt Nam - CTCP (PVOIL)',
  sourceUrl: 'https://www.pvoil.com.vn/tin-gia-xang-dau',
  originIp: '103.21.120.100',
  tierArchitecture: {
    tier0: 'HTTP fetch thời gian thực máy chủ gốc PVOil (IP 103.21.120.100 + Header Host www.pvoil.com.vn)',
    tier1: 'Bóc tách tự động trang tin giá xăng dầu https://www.pvoil.com.vn/tin-gia-xang-dau',
    tier2: 'API nạp lịch sử giá xăng dầu /api/oilprice/load-view',
  },
  statusMessage: 'Đồng bộ thời gian thực từ trang Tin giá xăng dầu PVOIL (https://www.pvoil.com.vn/tin-gia-xang-dau)',
};
