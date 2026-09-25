import bpy, os
out=os.path.dirname(os.path.abspath(__file__));s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.samples=12
for o in bpy.data.objects:
 if o.type=='FONT':
  m=o.data.materials[0];n=m.node_tree.nodes;n.clear();e=n.new('ShaderNodeEmission');e.inputs['Color'].default_value=(.008,.10,.12,1) if o.name in ['Eyebrow','Lower phase','Push phase'] else (.008,.018,.027,1);e.inputs['Strength'].default_value=1;outnode=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(e.outputs[0],outnode.inputs['Surface'])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'wall_pushup.blend'))
s.render.image_settings.file_format='PNG';s.render.filepath=os.path.join(out,'poster.png');s.frame_set(25);bpy.ops.render.render(write_still=True)
s.render.image_settings.media_type='VIDEO';s.render.image_settings.file_format='FFMPEG';s.render.ffmpeg.format='MPEG4';s.render.ffmpeg.codec='H264';s.render.ffmpeg.constant_rate_factor='HIGH';s.render.filepath=os.path.join(out,'wall_pushup.mp4');s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'wall_pushup.blend'))
bpy.ops.render.render(animation=True)
