import bpy, os
from mathutils import Vector
out=os.path.dirname(os.path.abspath(__file__))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True
for m in bpy.data.materials:
 c=m.diffuse_color;m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=c;n.inputs['Roughness'].default_value=.7
# Emissive lettering remains crisp, with no cast shadows.
for o in bpy.data.objects:
 if o.type=='FONT':
  old=o.data.materials[0];m=old.copy();m.name=old.name+' typography';n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Emission Color'].default_value=old.diffuse_color;n.inputs['Emission Strength'].default_value=1;o.data.materials[0]=m
s.world.use_nodes=True;s.world.node_tree.nodes.get('Background').inputs[0].default_value=(.82,.88,.92,1);s.world.node_tree.nodes.get('Background').inputs[1].default_value=.6
for name,loc,power,size in [('Key',(-3,-4,6),550,5),('Fill',(-1,4,4),350,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((-.5,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
s.camera.data.ortho_scale=4.4
for name in ['Tip','Footer']:
 bpy.data.objects[name].location.y-=.23
s.view_settings.view_transform='AgX'
s.render.filepath=os.path.join(out,'preview_final.png');s.frame_set(49);bpy.ops.render.render(write_still=True)
s.frame_set(1);s.render.filepath=os.path.join(out,'frames','frame_');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'wall_pushup.blend'))
print('FORMAT OPTIONS',s.render.image_settings.bl_rna.properties['file_format'].enum_items.keys())
