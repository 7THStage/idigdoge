module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
		, uglify: {
			coordinator: {
				files: {
					'public/coordinator.js': 'raw/coordinator.js'
				}
			}
			, worker: {
				options: {
					
				}
				, files: {
					'public/worker.part.js': 'raw/worker.js'
				}
			}
		}
		, concat: {
			worker: {
				src: ['scrypt/module.min.js', 'public/worker.part.js']
				, dest: 'public/worker.js'
			}
		}
		, cssmin: {
			main: {
				files: {
					'public/style.css': ['raw/style.css']
				}
			}
		}
		, clean: {
			build: ['public/worker.part.js']
			, all: ['public/worker.js', 'public/coordinator.js', 'public/style.css']
		}
		, watch: {
			js: {
				files: ['raw/*.js', 'scrypt/module.min.js']
				, tasks: ['uglify', 'concat', 'clean:build']
			}
			, css: {
				files: ['raw/*.css']
				, tasks: ['cssmin']
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	grunt.registerTask('default', ['uglify', 'concat', 'cssmin', 'clean:build']);
};
