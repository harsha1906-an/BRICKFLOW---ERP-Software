
const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertLessThanOneThousand = (n) => {
    if (n === 0) {
        return '';
    }

    if (n < 10) {
        return units[n];
    }

    if (n < 20) {
        return teens[n - 10];
    }

    if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    }

    return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
};

const numberToWords = (n) => {
    if (n === 0) return 'Zero';

    let num = Number(n);
    if (isNaN(num)) return '';

    const crores = Math.floor(num / 10000000);
    num -= crores * 10000000;

    const lakhs = Math.floor(num / 100000);
    num -= lakhs * 100000;

    const thousands = Math.floor(num / 1000);
    num -= thousands * 1000;

    const hundreds = num;

    let result = '';

    if (crores > 0) {
        result += convertLessThanOneThousand(crores) + ' Crore ';
    }

    if (lakhs > 0) {
        result += convertLessThanOneThousand(lakhs) + ' Lakh ';
    }

    if (thousands > 0) {
        result += convertLessThanOneThousand(thousands) + ' Thousand ';
    }

    if (hundreds > 0) {
        result += convertLessThanOneThousand(hundreds);
    }

    return result.trim() + ' Rupees Only';
};

export default numberToWords;
