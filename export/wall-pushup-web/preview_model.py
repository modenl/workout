import bpy,os
from mathutils import Vector
s=bpy.context.scene;s.frame_set(37);s.render.engine='CYCLES';s.cycles.samples=12;s.cycles.use_denoising=True;s.render.resolution_x=600;s.render.resolution_y=650;s.render.resolution_percentage=100
s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs[0].default_value=(.92,.92,.88,1);s.world.node_tree.nodes.get('Background').inputs[1].default_value=.8
for m in bpy.data.materials:
 c=tuple(m.diffuse_color);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=c
 if m.name=='wall':
  ns=m.node_tree.nodes;mix=ns.new('ShaderNodeMixShader');mix.inputs[0].default_value=.24;trans=ns.new('ShaderNodeBsdfTransparent');m.node_tree.links.new(trans.outputs[0],mix.inputs[1]);m.node_tree.links.new(n.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],ns.get('Material Output').inputs['Surface'])
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.size=5;bpy.context.object.rotation_euler=(Vector((-.4,0,1))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
s.camera.location=(1.8,-5,2.1);s.camera.rotation_euler=(Vector((-.4,0,.94))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=2.3;s.render.image_settings.file_format='PNG';s.render.filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)),'人物预览.png');bpy.ops.render.render(write_still=True)
