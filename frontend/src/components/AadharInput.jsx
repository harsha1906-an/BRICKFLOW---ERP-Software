import React from 'react';
import { Input } from 'antd';

const AadharInput = React.forwardRef((props, ref) => {
    const formatAadhar = (value) => {
        if (!value) return value;

        // Remove all non-digit characters
        const onlyNums = value.replace(/\D/g, '');

        // Limit to 12 digits
        const limited = onlyNums.slice(0, 12);

        // Add dashes after every 4 digits
        const formatted = limited.match(/.{1,4}/g)?.join('-') || limited;

        return formatted;
    };

    const handleChange = (e) => {
        const formatted = formatAadhar(e.target.value);

        // Update the input value with formatted version
        e.target.value = formatted;

        // Call the original onChange if provided
        if (props.onChange) {
            props.onChange(e);
        }
    };

    return (
        <Input
            {...props}
            ref={ref}
            onChange={handleChange}
            placeholder="XXXX-XXXX-XXXX"
            maxLength={14} // 12 digits + 2 dashes
        />
    );
});

AadharInput.displayName = 'AadharInput';

export default AadharInput;
