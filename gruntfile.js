module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
		, uglify: {
			main: {
				files: {
					'public/main.js': ['raw/util.js', 'raw/scrollnav.js', 'raw/balance.js', 'raw/emailwithdraw.js', 'raw/coordinator.js']
				}
			}
			, worker: {
				files: {
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
		, sass: {
			main: {
				files: {
					'public/style.unmin.css': 'raw/style.sass'
				}
			}
		}
		, cssmin: {
			main: {
				files: {
					'public/style.css': ['public/style.unmin.css']
				}
			}
		}
		, clean: {
			build: ['public/worker.part.js', 'public/style.unmin.css']
			, all: ['.sass-cache', 'public/worker.js', 'public/main.js', 'public/style.css']
		}
		, watch: {
			js: {
				files: ['raw/*.js', 'scrypt/module.min.js']
				, tasks: ['uglify', 'concat', 'clean:build']
			}
			, css: {
				files: ['raw/style.sass']
				, tasks: ['sass', 'cssmin', 'clean:build']
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	grunt.registerTask('default', ['uglify', 'concat', 'sass', 'cssmin', 'clean:build']);
};
