/*
  PLEASE ONLY EDIT THIS SECTION:

  IF RUNNING DIRECT, SET VARIABLE DIRECT TO TRUE, OTHERWISE SET TO FALSE
  PLEASE SET THE STEP NUMBER THAT YOU WILL BE TRACKING
*/
const running_direct = true;
const step = 1;

// END OF EDITABLE SECTION
// console.log('window.location.search', window.location.search)
// const urlParams = new URLSearchParams(window.location.search);
// const checkEvent = () => {
//   if (running_direct) {
//     if (step === 1) {
//       return "PageView";
//     } else if (step === 2) {
//       return "InitiateCheckout";
//     }
//   }
//
//   if (!running_direct) {
//     if (step === 1) {
//       return "PageView";
//     } else if (step === 2) {
//       return "AddToCart";
//     } else if (step === 3) {
//       return "InitiateCheckout";
//     }
//   }
// };
// const eventTime = +new Date();
// const eventType = checkEvent();
// const pixelId = urlParams.get("tg5");
// const fbclid = urlParams.get("fbclid");
// const tg2 = urlParams.get("tg2");
//
// fetch(
//   `http://localhost:5000/trk?pixel_id=${pixelId}&fbclid=${fbclid}&event_time=${eventTime}&tg2=${tg2}&eventType=${eventType}&running_direct=${running_direct}&step=${step}`
// )
//   .then((res) => res.json())
//   .then((data) => {
//     console.log('PIXEL CLICK')
//     console.log(data)
//   });
