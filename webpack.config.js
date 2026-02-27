const path = require('path')

module.exports = {
	entry: {
		admin: path.join(__dirname, 'src', 'admin.js'),
		'public-share-rewrite': path.join(__dirname, 'src', 'public-share-rewrite.js'),
	},
	output: {
		path: path.resolve(__dirname, 'js'),
		filename: 'custom_public_share-[name].js',
		chunkFilename: 'custom_public_share-[name].js',
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
}
