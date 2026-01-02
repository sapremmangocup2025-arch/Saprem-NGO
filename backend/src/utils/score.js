exports.calcMarks = (submittedValue, target, maxMarks)=>{
if(target <= 0) return 0;
const ratio = submittedValue / target;
const fraction = Math.min(ratio, 1);
const marks = fraction * maxMarks;
return Math.round(marks*100)/100; // 2 decimal
}