 /* ------------------------------------------------------------------------------------
 file : Program.cs
 author : António Domingos Ana Sofia
 date : hepia Spring 2015
 description : Program c# for the Kinect 
  ------------------------------------------------------------------------------------- */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Fleck;
using Microsoft.Kinect;
using SocketIO.Client;
using System.Windows.Media.Imaging;
using System.Windows.Media;
using System.Windows;


namespace Kinect{
    class Program{
        static Skeleton[] skeletons = new Skeleton[6]; // table of skeleton detected
        static Namespace socket; // socket
        static KinectSensor sensor; // kinect


        /*
         function main 
         params : args for the main
        */
        static void Main(string[] args){
            var connected = InitializeConnection();
            if (connected)
                InitilizeKinect();

            Console.ReadLine();
        }


        /*
         function InitializeConnection who initialize socket.io connection with the server Web Virtual-Vertigo 
         params : none
        */
        private static bool InitializeConnection(){
            var io = new SocketIOClient();

            socket = io.Connect("http://localhost:3000/");
            if (io.Connected)
            {
                Console.WriteLine("kinect connected to server");
                return true;
            }
            else
            {
                Console.WriteLine("failed to connect to server");
                return false;
            }
        }

        /*
         function InitilizeKinect who initialize the kinect 
         params : none
        */
        private static void InitilizeKinect(){
            sensor = KinectSensor.KinectSensors.SingleOrDefault();
            if (sensor != null)
            {
                sensor.SkeletonStream.TrackingMode = SkeletonTrackingMode.Default;
                sensor.SkeletonStream.Enable(new TransformSmoothParameters()
                {
                    Smoothing = 0.5f,
                    Correction = 0.5f,
                    Prediction = 0.5f,
                    JitterRadius = 0.05f,
                    MaxDeviationRadius = 0.04f
                });
                sensor.AllFramesReady += Sensor_AllFramesReady;

                sensor.Start();
                Console.WriteLine("sensor started");
            }
        }


        /*
         function Sensor_AllFramesReady who capture the skeleton of the person
         params : sender Kinect
                  e all the frames ready for the skeleton stream
        */
        static void Sensor_AllFramesReady(object sender, AllFramesReadyEventArgs e) {
            using (var frame = e.OpenSkeletonFrame()) {
                if (frame != null){
                    frame.CopySkeletonDataTo(skeletons);

                    foreach (Skeleton skeleton in skeletons)
                    {
                        if (skeleton.TrackingState == SkeletonTrackingState.Tracked)
                        {
                            socket.Emit("squelette", skeleton.Joints);
                            foreach (BoneOrientation orientation in skeleton.BoneOrientations)
                            {
                                if (orientation.StartJoint == JointType.WristLeft || orientation.StartJoint == JointType.WristRight)
                                    socket.Emit("orientation", orientation.StartJoint, orientation.EndJoint, orientation.AbsoluteRotation.Quaternion);
                            }
                        }
                    }
                }
            } 
        }
    }
}
