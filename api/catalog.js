// Server-side catalogue used to build the emailed quotation.
// price = ex-showroom INR per unit WITHOUT GST. null => "best price shared on call".
export const GST_RATE = 0.18;
export const QUOTE_VALID_DAYS = 7;

export const CATALOG = {
  'rt-5376':  { name: 'Redtuff RT-5.376KWH E-Rickshaw Battery', v: 51.2, ah: 105, kwh: 5.376, warranty: 36, price: null,
                extra: '16S1P prismatic LFP, 44 ± 1 kg, 20 A standard / 25 A max charge, MS sheet metal casing' },
  'lg-5112':  { name: 'Livgreen 51.2V 105Ah E-Rickshaw Battery', v: 51.2, ah: 105, kwh: 5.376, warranty: 36, price: null,
                extra: '16S1P prismatic LFP, 44 ± 1 kg, 20 A standard / 25 A max charge, MS sheet metal casing' },
  'lg-96105': { name: 'Livgreen 96V 105Ah High-Voltage EV Battery', v: 96, ah: 105, kwh: 10.08, warranty: 36, price: null,
                extra: 'Live charge display, for e-loaders / fleet / custom EVs (application check required)' },
  'lg-4830':  { name: 'Livgreen LG-4830 E-Vehicle Battery', v: 48, ah: 30, kwh: 1.44, warranty: 36, price: null, extra: 'Anderson-type connector' },
  'lg-6030':  { name: 'Livgreen LG-6030 E-Vehicle Battery', v: 60, ah: 30, kwh: 1.8, warranty: 36, price: null, extra: 'Anderson-type connector' },
  'lg-6032':  { name: 'Livgreen LG 6032 E-Vehicle Battery', v: 60, ah: 32, kwh: 1.92, warranty: 36, price: null, extra: 'Anderson-type connector' },
  'lg-7230':  { name: 'Livgreen LG-7230 E-Vehicle Battery', v: 72, ah: 30, kwh: 2.16, warranty: 36, price: null, extra: 'Anderson-type connector' },
  'rt-6030':  { name: 'Redtuff RT-6030 E-Vehicle Battery', v: 60, ah: 30, kwh: 1.8, warranty: 36, price: null, extra: 'Anderson-type connector' },
  'rles-6030':{ name: 'Revolt RLES 60V 30Ah E-Vehicle Battery', v: 60, ah: 30, kwh: 1.8, warranty: 36, price: null, extra: 'Bluetooth smart BMS' },
  'rles-4830':{ name: 'Revolt RLES 48V 30Ah E-Vehicle Battery', v: 48, ah: 30, kwh: 1.44, warranty: 36, price: null, extra: 'Bluetooth smart BMS' },
  'rt-1344':  { name: 'Redtuff RT-1.344KWH Inverter Battery', v: 12.8, ah: 105, kwh: 1.344, warranty: 60, price: null, extra: 'For 12V home inverters' },
  'rt-2688':  { name: 'Redtuff RT-2.688KWH Inverter Battery', v: 25.6, ah: 105, kwh: 2.688, warranty: 60, price: null, extra: 'For 24V home and office inverters' },
  'rt-5040':  { name: 'Redtuff RT-5.040KWH Inverter Battery', v: 48, ah: 105, kwh: 5.04, warranty: 60, price: null, extra: 'For 48V inverters and solar hybrid systems, built-in display' },
  'lg-2688':  { name: 'Livgreen LG 2.688KWH Inverter Battery', v: 25.6, ah: 105, kwh: 2.688, warranty: 60, price: null, extra: 'For 24V home and office inverters' },
  'lg-5040':  { name: 'Livgreen LG-5.040KWH Inverter Battery', v: 48, ah: 105, kwh: 5.04, warranty: 60, price: null, extra: 'For 48V inverters and solar hybrid systems, LCD pack info' }
};
