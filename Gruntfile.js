module.exports = function(grunt) {

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  
  grunt.initConfig({
    clean: ['dist'],

    jshint: {
      all: {
        src: ['Gruntfile.js', 'src/**/*.js'],
        options: {
          '-W014': true,
          '-W030': true
        }
      }
    },
    
    browserify: {
      lib: {
        src: 'src/frontend.js',
        dest: 'www/javascript/scripts.js'
      }
    },

    karma: {
      local: {
        configFile: 'karma.conf.js'
      },
      travis: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['Firefox']
      }
    },

    watch: {
      code: {
        files: ['src/**/*.js'],
        tasks: ['jshint', 'dist']
      }
    },

    parallel: {
      testing: {
        options: {
          stream: true
        },
        tasks: [{
          grunt: true,
          args: ['karma:local']
        },{
          grunt: true,
          args: ['watch']
        }]
      }
    }
  });

  grunt.registerTask('dist', [
    'clean',
    'browserify'
  ]);

  grunt.registerTask('test', [
    'dist',
    'parallel:testing'
  ]);

  grunt.registerTask('hint', [
    'jshint'
  ]);

  grunt.registerTask('default', [
    'test'
  ]);

  grunt.registerTask('travis', [
    'dist',
    'karma:travis'
  ]);

};

