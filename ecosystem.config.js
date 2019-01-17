module.exports = {
	apps : [{
		name        : 'Big-Bell',
		script      : './index.js',
		watch       : false,
		error_file	: 'bbOut.log',
		out_file		: 'bbOut.log',
		log_type		: 'json',
		log_date_format: 'YYYY-MM-DD HH:mm',
	}],
};
