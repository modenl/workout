import bpy, math, os
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for d in bpy.data.materials: bpy.data.materials.remove(d)
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=960; scene.render.resolution_y=720; scene.render.resolution_percentage=100
scene.render.fps=24; scene.frame_start=1; scene.frame_end=192
scene.world.color=(0.85,0.88,0.90)
s=scene.display.shading
s.light='STUDIO'; s.studiolight_rotate_z=0.4; s.color_type='MATERIAL'; s.show_shadows=True
s.show_cavity=True; s.cavity_type='BOTH'; s.curvature_ridge_factor=1.25; s.curvature_valley_factor=0.8
s.show_specular_highlight=True; s.background_type='WORLD'; s.show_object_outline=False
scene.display.render_aa='16'
scene.view_settings.view_transform='Standard'
def mat(n,c):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); return m
teal=mat('Shirt • teal',(0.035,0.45,0.49)); navy=mat('Trousers • navy',(0.045,0.11,0.19)); skin=mat('Mannequin • porcelain',(0.83,0.73,0.60)); dark=mat('Shoes',(0.08,0.14,0.20)); wallmat=mat('Wall',(0.69,0.76,0.79)); floor=mat('Stage',(0.88,0.90,0.90)); white=mat('Lettering',(0.95,0.97,0.98)); ink=mat('Ink',(0.08,0.18,0.25)); orange=mat('Accent',(0.99,0.47,0.18)); pale=mat('Guide',(0.55,0.70,0.73))
def uv(n,r,ma):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1)
 o=bpy.context.object; o.name=n; o.scale=r; o.data.materials.append(ma)
 for p in o.data.polygons:p.use_smooth=True
 return o
def cube(n,loc,scale,ma,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma)
 if bevel:
  mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def rod(n,r,ma):return uv(n,(r,r,1),ma)
def place(o,p,scale=None,quat=None,key=False):
 o.location=p
 if scale:o.scale=scale
 if quat:o.rotation_mode='QUATERNION';o.rotation_quaternion=quat
 if key:
  o.keyframe_insert('location');o.keyframe_insert('scale');o.keyframe_insert('rotation_quaternion')
def link(o,a,b,r,key=True):
 a,b=Vector(a),Vector(b);d=b-a
 place(o,(a+b)/2,(r,r,d.length/2+r*0.45),d.to_track_quat('Z','Y'),key)
cube('Floor',(0,0,-0.05),(200,200,0.08),floor)
cube('Training mat',(-0.94,0,-0.003),(1.12,1.05,0.018),pale,0.04)
cube('Wall',(0.07,0,1.17),(0.12,1.32,2.34),wallmat,0.025)
cube('Wall top trim',(0.07,0,2.35),(0.135,1.34,0.035),teal,0.009)
# Palm contact marks stay fixed to the front surface.
for side in [-1,1]:
 cube('Hand contact',(-0.002,side*0.25,1.44),(0.014,0.17,0.24),pale,0.015)
parts={}
for n,r,m in [('Torso',(0.135,0.25,0.29),teal),('Waist',(0.12,0.18,0.18),teal),('Pelvis',(0.135,0.19,0.15),navy),('Neck',(0.065,0.065,0.09),skin),('Head',(0.105,0.095,0.14),skin),('Nose',(0.035,0.035,0.03),skin)]:parts[n]=uv(n,r,m)
for side in [-1,1]:
 for n,r,m in [('Thigh',.09,navy),('Shin',.067,navy),('Upper arm',.062,teal),('Forearm',.048,skin)]:parts[(n,side)]=rod(n+str(side),r,m)
 for n,r,m in [('Shoulder',(.071,.075,.074),teal),('Elbow',(.049,.049,.049),skin),('Knee',(.073,.073,.073),navy),('Palm',(.033,.060,.10),skin),('Shoe',(.155,.082,.060),dark)]:parts[(n,side)]=uv(n+str(side),r,m)
# Orthographic three-quarter side view, leaving room for instructional typography.
bpy.ops.object.camera_add(location=(-2.8,-7.5,2.65));cam=bpy.context.object;cam.name='Demo camera'
target=Vector((-0.45,0,1.18));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.9;scene.camera=cam
font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Unicode.ttf')
def label(name,body,x,y,size,ma):
 cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.font=font;cu.size=size;cu.extrude=0
 o=bpy.data.objects.new(name,cu);scene.collection.objects.link(o);o.parent=cam;o.location=(x,y,-4);cu.materials.append(ma);return o
label('Eyebrow','MOVEMENT  /  01',-1.73,1.22,.065,teal)
label('Title','墙面俯卧撑',-1.74,.99,.155,ink)
label('English','WALL PUSH-UP',-1.72,.86,.057,ink)
label('Tip','手掌与肩同高 · 收紧腹部 · 身体保持直线',-1.72,-1.18,.066,ink)
label('Footer','缓慢靠近墙面，再用双手推回起始位置',-1.72,-1.31,.060,ink)
phase1=label('Lower phase','01  屈肘靠近',.86,.98,.083,teal)
phase2=label('Push phase','02  推回起点',.86,.98,.083,teal)
label('Timing','2 秒靠近 / 2 秒推回',.86,.83,.054,ink)
# Body rotates as a unit around the ankles; analytical two-bone arms keep palms planted.
for f in range(1,193):
 scene.frame_set(f)
 t=((f-1)%96)/96
 theta=.13+(.39-.13)*(0.5-0.5*math.cos(2*math.pi*t))
 axis=Vector((math.sin(theta),0,math.cos(theta)));base=Vector((-1.02,0,.095));q=axis.to_track_quat('Z','Y')
 def body(h,y=0):return base+axis*h+Vector((0,y,0))
 for n,h in [('Pelvis',.79),('Waist',.97),('Torso',1.16),('Neck',1.44),('Head',1.59)]:place(parts[n],body(h),quat=q,key=True)
 place(parts['Nose'],body(1.59)+Vector((.105,0,-.01)),quat=q,key=True)
 for side in [-1,1]:
  hip=body(.78,side*.12);knee=body(.40,side*.13);ankle=body(0,side*.14)
  link(parts[('Thigh',side)],hip,knee,.088);link(parts[('Shin',side)],knee,ankle,.064)
  place(parts[('Knee',side)],knee,key=True);place(parts[('Shoe',side)],(-.98,side*.14,.065),key=True)
  shoulder=body(1.32,side*.225); wrist=Vector((-.06,side*.25,1.42))
  d=wrist-shoulder; midpoint=(shoulder+wrist)*.5
  bend=Vector((0,side*.24,-1));bend=(bend-d.normalized()*bend.dot(d.normalized())).normalized()
  assert d.length < .80
  elbow=midpoint+bend*math.sqrt(.40**2-(d.length/2)**2)
  link(parts[('Upper arm',side)],shoulder,elbow,.061);link(parts[('Forearm',side)],elbow,wrist,.047)
  place(parts[('Shoulder',side)],shoulder,key=True);place(parts[('Elbow',side)],elbow,key=True);place(parts[('Palm',side)],(-.040,side*.25,1.47),key=True)
 for obj,show in [(phase1,t<.5),(phase2,t>=.5)]:
  obj.scale=(1,1,1) if show else (0,0,0);obj.keyframe_insert('scale')
for name,frame in [('靠近 / Lower',1),('推回 / Push',49),('靠近 / Lower',97),('推回 / Push',145)]:scene.timeline_markers.new(name,frame=frame)
scene.frame_set(1)
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(OUT,'frames','frame_')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'wall_pushup.blend'))
for f in [1,49]:
 scene.frame_set(f);scene.render.filepath=os.path.join(OUT,f'preview_{f:03}.png');bpy.ops.render.render(write_still=True)
scene.render.filepath=os.path.join(OUT,'frames','frame_');scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'wall_pushup.blend'))
