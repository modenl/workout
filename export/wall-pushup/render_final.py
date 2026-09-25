import bpy,os
out=os.path.dirname(os.path.abspath(__file__));s=bpy.context.scene
s.render.engine='BLENDER_EEVEE'
s.render.image_settings.media_type='VIDEO';s.render.image_settings.file_format='FFMPEG';s.render.ffmpeg.format='MPEG4';s.render.ffmpeg.codec='H264';s.render.ffmpeg.constant_rate_factor='HIGH';s.render.filepath=os.path.join(out,'wall_pushup.mp4');s.frame_set(1)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'wall_pushup.blend'))
bpy.ops.render.render(animation=True)
