// Data Zon JAKIM Malaysia (59 Zon) & Koordinat GPS Pusat
const JAKIM_ZONES = [
    // WILAYAH PERSEKUTUAN
    { code: 'WLY01', state: 'Wilayah Persekutuan', name: 'Kuala Lumpur, Putrajaya', lat: 3.1390, lng: 101.6869 },
    { code: 'WLY02', state: 'Wilayah Persekutuan', name: 'Labuan', lat: 5.2831, lng: 115.2308 },

    // SELANGOR
    { code: 'SGR01', state: 'Selangor', name: 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam', lat: 3.0738, lng: 101.5183 },
    { code: 'SGR02', state: 'Selangor', name: 'Kuala Selangor, Sabak Bernam', lat: 3.3421, lng: 101.2505 },
    { code: 'SGR03', state: 'Selangor', name: 'Klang, Kuala Langat', lat: 2.9551, lng: 101.4464 },

    // JOHOR
    { code: 'JHR01', state: 'Johor', name: 'Pulau Aur dan Pulau Pemanggil', lat: 2.4500, lng: 104.5333 },
    { code: 'JHR02', state: 'Johor', name: 'Johor Bahru, Kota Tinggi, Mersing, Kulai', lat: 1.4927, lng: 103.7414 },
    { code: 'JHR03', state: 'Johor', name: 'Kluang, Pontian', lat: 2.0305, lng: 103.3172 },
    { code: 'JHR04', state: 'Johor', name: 'Batu Pahat, Muar, Segamat, Tangkak', lat: 1.8548, lng: 102.9325 },

    // KEDAH
    { code: 'KDH01', state: 'Kedah', name: 'Kota Setar, Pokok Sena, Kubang Pasu', lat: 6.1248, lng: 100.3678 },
    { code: 'KDH02', state: 'Kedah', name: 'Kuala Muda, Yan, Pendang', lat: 5.6433, lng: 100.4908 },
    { code: 'KDH03', state: 'Kedah', name: 'Padang Terap, Sik', lat: 6.2084, lng: 100.6125 },
    { code: 'KDH04', state: 'Kedah', name: 'Baling', lat: 5.6775, lng: 100.9169 },
    { code: 'KDH05', state: 'Kedah', name: 'Bandar Baharu, Kulim', lat: 5.3708, lng: 100.5547 },
    { code: 'KDH06', state: 'Kedah', name: 'Langkawi', lat: 6.3500, lng: 99.8000 },
    { code: 'KDH07', state: 'Kedah', name: 'Puncak Gunung Jerai', lat: 5.7872, lng: 100.4344 },

    // KELANTAN
    { code: 'KTN01', state: 'Kelantan', name: 'Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku', lat: 6.1256, lng: 102.2381 },
    { code: 'KTN02', state: 'Kelantan', name: 'Gua Musang (Mukim Galas dan Bertam), Jeli', lat: 4.8844, lng: 101.9686 },

    // MELAKA
    { code: 'MLK01', state: 'Melaka', name: 'Seluruh Negeri Melaka', lat: 2.1896, lng: 102.2501 },

    // NEGERI SEMBILAN
    { code: 'NGS01', state: 'Negeri Sembilan', name: 'Tampin, Rembau', lat: 2.4701, lng: 102.2299 },
    { code: 'NGS02', state: 'Negeri Sembilan', name: 'Jelebu, Jempol, Kuala Pilah', lat: 2.7389, lng: 102.2500 },
    { code: 'NGS03', state: 'Negeri Sembilan', name: 'Port Dickson, Seremban', lat: 2.7258, lng: 101.9424 },

    // PAHANG
    { code: 'PHG01', state: 'Pahang', name: 'Pulau Tioman', lat: 2.7902, lng: 104.1656 },
    { code: 'PHG02', state: 'Pahang', name: 'Kuantan, Pekan, Rompin, Muadzam Shah', lat: 3.8077, lng: 103.3260 },
    { code: 'PHG03', state: 'Pahang', name: 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka', lat: 3.4900, lng: 102.4300 },
    { code: 'PHG04', state: 'Pahang', name: 'Bentong, Raub, Lipis', lat: 3.5200, lng: 101.9100 },
    { code: 'PHG05', state: 'Pahang', name: 'Genting Sempah, Janda Baik, Bukit Tinggi', lat: 3.3500, lng: 101.7800 },
    { code: 'PHG06', state: 'Pahang', name: 'Cameron Highlands, Genting Highlands, Bukit Fraser', lat: 4.4714, lng: 101.3768 },

    // PERAK
    { code: 'PRK01', state: 'Perak', name: 'Tapah, Slim River, Tanjung Malim', lat: 3.8290, lng: 101.5204 },
    { code: 'PRK02', state: 'Perak', name: 'Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar', lat: 4.5975, lng: 101.0901 },
    { code: 'PRK03', state: 'Perak', name: 'Lenggong, Pengkalan Hulu, Grik', lat: 5.4244, lng: 101.1278 },
    { code: 'PRK04', state: 'Perak', name: 'Temengor, Belum', lat: 5.5500, lng: 101.3500 },
    { code: 'PRK05', state: 'Perak', name: 'Kg Gajah, Teluk Intan, Bagan Datuk, Seri Manjung, Beruas, Lumut, Sitiawan, Pulau Pangkor', lat: 4.2000, lng: 100.6000 },
    { code: 'PRK06', state: 'Perak', name: 'Selama, Taiping, Bagan Serai, Parit Buntar', lat: 4.8500, lng: 100.7333 },
    { code: 'PRK07', state: 'Perak', name: 'Bukit Larut (Maxwell Hill)', lat: 4.8622, lng: 100.7925 },

    // PERLIS
    { code: 'PLS01', state: 'Perlis', name: 'Kangar, Padang Besar, Arau', lat: 6.4414, lng: 100.1986 },

    // PULAU PINANG
    { code: 'PNG01', state: 'Pulau Pinang', name: 'Seluruh Negeri Pulau Pinang', lat: 5.4164, lng: 100.3327 },

    // SABAH
    { code: 'SBH01', state: 'Sabah', name: 'Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Sukau', lat: 5.8402, lng: 118.1179 },
    { code: 'SBH02', state: 'Sabah', name: 'Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)', lat: 5.8821, lng: 117.5583 },
    { code: 'SBH03', state: 'Sabah', name: 'Lahat Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)', lat: 5.0268, lng: 118.3270 },
    { code: 'SBH04', state: 'Sabah', name: 'Bandar Tawau, Balung, Merotai, Kalabakan, Bahagian Tawau (Barat)', lat: 4.2447, lng: 117.8912 },
    { code: 'SBH05', state: 'Sabah', name: 'Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat', lat: 6.8833, lng: 116.8333 },
    { code: 'SBH06', state: 'Sabah', name: 'Gunung Kinabalu', lat: 6.0750, lng: 116.5583 },
    { code: 'SBH07', state: 'Sabah', name: 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat', lat: 5.9804, lng: 116.0735 },
    { code: 'SBH08', state: 'Sabah', name: 'Pensiangan, Nabawan, Sook, Tambunan, Keningau, Tenom, Membakut, Beaufort, Sipitang, Kuala Penyu, Weston', lat: 5.3370, lng: 116.1593 },
    { code: 'SBH09', state: 'Sabah', name: 'Pulau Layang-Layang', lat: 7.3756, lng: 113.8433 },

    // SARAWAK
    { code: 'SWK01', state: 'Sarawak', name: 'Limbang, Lawas, Sundar, Trusan', lat: 4.7500, lng: 115.0000 },
    { code: 'SWK02', state: 'Sarawak', name: 'Miri, Niah, Bekenu, Sibuti, Marudi', lat: 4.3995, lng: 113.9914 },
    { code: 'SWK03', state: 'Sarawak', name: 'Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu', lat: 3.1667, lng: 113.0333 },
    { code: 'SWK04', state: 'Sarawak', name: 'Sibu, Mukah, Dalat, Oya, Balingian, Kanowit, Selangau', lat: 2.3000, lng: 111.8167 },
    { code: 'SWK05', state: 'Sarawak', name: 'Sarikei, Matu, Daro, Song, Rajang, Julau, Pakan, Kapit', lat: 2.1167, lng: 111.5167 },
    { code: 'SWK06', state: 'Sarawak', name: 'Kota Samarahan, Simunjan, Sadong Jaya, Sebuyau, Meludam', lat: 1.4500, lng: 110.4500 },
    { code: 'SWK07', state: 'Sarawak', name: 'Sri Aman, Betong, Spaoh, Pusa, Roban, Lingga, Engkilili, Lubok Antu', lat: 1.2333, lng: 111.4500 },
    { code: 'SWK08', state: 'Sarawak', name: 'Kuching, Bau, Lundu, Sematan', lat: 1.5533, lng: 110.3592 },
    { code: 'SWK09', state: 'Sarawak', name: 'Zon Khas (Kampung Matang)', lat: 1.6000, lng: 110.2500 },

    // TERENGGANU
    { code: 'TRG01', state: 'Terengganu', name: 'Kuala Terengganu, Marang, Kuala Nerus', lat: 5.3302, lng: 103.1408 },
    { code: 'TRG02', state: 'Terengganu', name: 'Besut, Setiu', lat: 5.7500, lng: 102.5500 },
    { code: 'TRG03', state: 'Terengganu', name: 'Hulu Terengganu', lat: 5.0667, lng: 102.9500 },
    { code: 'TRG04', state: 'Terengganu', name: 'Dungun, Kemaman', lat: 4.7667, lng: 103.4167 }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = JAKIM_ZONES;
}
