/*
 After you have changed any settings for the responsive_images task,
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

    grunt.initConfig({
      responsive_images: {
        dev: {
          options: {
            engine: 'im',
            sizes: [
              {name: 'small', width: 425, quality: 75},
              {name: 'medium', width: 625, quality: 75},
              {name: 'large', width: 800, quality: 75}
            ]
          },
          files: [{
            expand: true,
            src: ['*.{gif,jpg,png}'],
            cwd: 'img/',
            dest: 'img_sized/'
          }]
        }
      },
  
      /* Clear out the images directory if it exists */
      clean: {
        dev: {
          src: ['img_sized'],
        },
      },
  
      /* Generate the images directory if it is missing */
      mkdir: {
        dev: {
          options: {
            create: ['img_sized']
          },
        },
      },
  
      /* Copy the "fixed" images that don't go through processing into the images/directory */
      copy: {
        dev: {
          files: [{
            expand: true,
            src: ['img/fixed/*.{gif,jpg,png}'],
            dest: 'img_sized/fixed/',
            flatten: true,
          }]
        },
      },
  
    });
  
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
  
  };