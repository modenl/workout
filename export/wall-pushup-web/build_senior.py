import bpy,math,json,os
from mathutils import Vector, Quaternion
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=97;scene.render.fps=24
materials={}
for name,c in {'sage':(.27,.45,.39),'pants':(.22,.28,.32),'skin':(.78,.56,.40),'hair':(.77,.79,.76),'eye':(.12,.14,.13),'shoe':(.91,.89,.82),'sole':(.50,.55,.51),'wall':(.74,.81,.75),'floor':(.93,.92,.88),'mat':(.77,.81,.74)}.items():
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);materials[name]=m
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10);sphere=bpy.context.object.data.copy();bpy.data.objects.remove(bpy.context.object,do_unlink=True)
for p in sphere.polygons:p.use_smooth=True
bpy.ops.mesh.primitive_cube_add(size=1);box=bpy.context.object.data.copy();bpy.data.objects.remove(bpy.context.object,do_unlink=True)
objects=[]
def obj(name,scale,mat,loc=(0,0,0),parent=None,mesh=None):
 o=bpy.data.objects.new(name,mesh or sphere);scene.collection.objects.link(o);o.location=loc;o.scale=scale
 # Object-linked materials preserve shared mesh geometry.
 if not o.data.materials:o.data.materials.append(materials[mat])
 o.material_slots[0].link='OBJECT';o.material_slots[0].material=materials[mat]
 if parent:o.parent=parent
 objects.append(o);return o
parts={}
for n,r,m in [('Torso',(.12,.215,.255),'sage'),('Waist',(.12,.17,.16),'sage'),('Pelvis',(.13,.18,.145),'pants'),('Neck',(.06,.065,.085),'skin'),('Head',(.108,.098,.137),'skin')]:parts[n]=obj(n,r,m)
# Facial features use a head-space parent, independent of head ellipsoid scaling.
face=bpy.data.objects.new('Face rig',None);scene.collection.objects.link(face)
obj('Nose',(.029,.025,.028),'skin',(.104,0,.008),face)
for side in [-1,1]:
 obj('Ear',(.030,.023,.040),'skin',(-.006,side*.099,-.002),face)
 obj('Eye',(.011,.013,.012),'eye',(.097,side*.042,.042),face)
 brow=obj('Silver eyebrow',(.008,.024,.007),'hair',(.097,side*.045,.065),face)
 obj('Temple silver hair',(.07,.023,.070),'hair',(-.027,side*.078,.067),face)
# A swept silver crown, with a slightly receding hairline.
obj('Silver back hair',(.069,.09,.095),'hair',(-.045,0,.049),face)
obj('Silver crown',(.085,.083,.043),'hair',(-.016,0,.117),face)
obj('Hair sweep',(.060,.066,.026),'hair',(.031,-.014,.119),face)
# Subtle curved smile made from short connected pieces.
for i in range(7):
 y=(i-3)*.0065;obj('Smile',(.005,.0048,.0037),'eye',(.098,y,-.049+.12*abs(i-3)*.014),face)
for side in [-1,1]:
 for n,r,m in [('Thigh',.086,'pants'),('Shin',.064,'pants'),('Upper arm',.059,'sage'),('Forearm',.045,'skin')]:parts[n,side]=obj(n+str(side),(r,r,1),m)
 for n,r,m in [('Shoulder',(.066,.068,.069),'sage'),('Elbow',(.047,.047,.047),'skin'),('Knee',(.068,.068,.068),'pants'),('Palm',(.027,.052,.09),'skin'),('Shoe',(.143,.077,.056),'shoe'),('Sole',(.146,.079,.016),'sole')]:parts[n,side]=obj(n+str(side),r,m)
obj('Floor',(5,5,.018),'floor',(-.5,0,-.028),mesh=box)
obj('Exercise mat',(1.05,.86,.009),'mat',(-.83,0,-.008),mesh=box)
obj('Wall',(.065,.90,1.94),'wall',(.033,0,.97),mesh=box)
obj('Wall rail',(.072,.92,.019),'sage',(.033,0,1.95),mesh=box)
for side in [-1,1]:obj('Palm marker',(.008,.13,.19),'mat',(-.006,side*.22,1.395),mesh=box)
def put(o,p,q=None,scale=None):
 o.location=p
 if q:o.rotation_mode='QUATERNION';o.rotation_quaternion=q
 if scale:o.scale=scale
 for prop in ['location','rotation_quaternion','scale']:o.keyframe_insert(prop)
def link(o,a,b,r):
 d=b-a;put(o,(a+b)/2,d.to_track_quat('Z','Y'),(r,r,d.length/2+r*.5))
for f in range(1,98):
 scene.frame_set(f);theta=.12+.245*(.5-.5*math.cos(2*math.pi*(f-1)/96));axis=Vector((math.sin(theta),0,math.cos(theta)));base=Vector((-.91,0,.09));q=Quaternion((0,1,0),theta)
 def body(h,y=0):return base+axis*h+Vector((0,y,0))
 for n,h in [('Pelvis',.73),('Waist',.89),('Torso',1.08),('Neck',1.34),('Head',1.48)]:put(parts[n],body(h),q)
 put(face,body(1.48),q)
 for side in [-1,1]:
  hip=body(.72,side*.115);knee=body(.365,side*.12);ankle=body(0,side*.13)
  link(parts['Thigh',side],hip,knee,.083);link(parts['Shin',side],knee,ankle,.063)
  put(parts['Knee',side],knee);put(parts['Shoe',side],(-.87,side*.13,.056));put(parts['Sole',side],(-.87,side*.13,.014))
  sh=body(1.235,side*.205);w=Vector((-.049,side*.22,1.34));d=w-sh;u=d.normalized();bend=Vector((0,side*.22,-1));bend=(bend-u*bend.dot(u)).normalized();el=(sh+w)/2+bend*math.sqrt(.365**2-(d.length/2)**2)
  link(parts['Upper arm',side],sh,el,.058);link(parts['Forearm',side],el,w,.044);put(parts['Shoulder',side],sh);put(parts['Elbow',side],el);put(parts['Palm',side],(-.031,side*.22,1.40))
# Pack low-poly meshes and sampled transforms into a compact browser scene.
geo=[];geoids={};items=[]
def rnd(a):return [round(float(x),5) for x in a]
for o in objects:
 key=o.data.as_pointer()
 if key not in geoids:
  me=o.data;me.calc_loop_triangles();verts=[];normals=[];indices=[];unique={}
  for tri in me.loop_triangles:
   for vi in tri.vertices:
    v=me.vertices[vi];normal=v.normal if me.polygons[tri.polygon_index].use_smooth else tri.normal;k=tuple(rnd(v.co))+tuple(rnd(normal))
    if k not in unique:unique[k]=len(unique);verts.extend(k[:3]);normals.extend(k[3:])
    indices.append(unique[k])
  geoids[key]=len(geo);geo.append({'p':verts,'n':normals,'i':indices})
 transforms=[]
 for f in range(1,98,4):
  scene.frame_set(f);bpy.context.view_layer.update();p,q,s=o.matrix_world.decompose();transforms.append(rnd([*p,q.x,q.y,q.z,q.w,*s]))
 if all(t==transforms[0] for t in transforms):transforms=transforms[:1]
 items.append({'name':o.name,'g':geoids[key],'c':rnd(o.material_slots[0].material.diffuse_color[:3]),'t':transforms})
with open(os.path.join(OUT,'scene.json'),'w') as fp:json.dump({'meshes':geo,'objects':items,'duration':4},fp,separators=(',',':'))
scene.frame_set(1)
bpy.ops.object.camera_add(location=(.8,-5.4,2.5));camera=bpy.context.object;camera.rotation_euler=(Vector((-.4,0,.9))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.6;scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'senior_wall_pushup.blend'))
print('Web scene bytes',os.path.getsize(os.path.join(OUT,'scene.json')),'Objects',len(items))
