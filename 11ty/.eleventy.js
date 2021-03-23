module.exports = function(eleventyConfig) {
	// Universal filters add to:
	// * Liquid
	// * Nunjucks
	// * Handlebars
	// * JavaScript (New in 0.7.0)
	eleventyConfig.addFilter("myFilter", function(value) {
	  return value;
	});

	return { 
		dir: {
			input: "./",
			output: "../static"
		}
	}
  };