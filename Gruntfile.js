module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    copy: {
    	main: {
    		src: 'src/client/app/widgets/grid/*',
			dest: 'dist/',
			expand: true,
			flatten: true
    	}
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['copy']);
};

