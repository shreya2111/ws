#!/usr/bin/env python

#Import required libraries
import numpy as np
import cv2

def img_stitch(n_row, n_col, folder_name, output_folder):
	for x in range(1, n_row+1):
		new_img = cv2.imread(str(folder_name)+'/Satellite/'+str(x)+'_1.png')
		roadmap = cv2.imread(str(folder_name)+'/Roadmap/'+str(x)+'_1.png')
		for y in range(2, n_col+1):
			img1 = new_img
			img2 = cv2.imread(str(folder_name)+'/Satellite/'+str(x)+'_'+str(y)+'.png')
			img3 = roadmap
			img4 = cv2.imread(str(folder_name)+'/Roadmap/'+str(x)+'_'+str(y)+'.png')
			im1size = img1.shape
			i = im1size[1]-394-1
			while i>=im1size[1]-394-1-7:
				flag = 0
				t = 10
				for j in range(0,500):
					if ((img1.item(j,i,0)==img2.item(j,0,0)) and (img1.item(j,i,1)==img2.item(j,0,1)) and (img1.item(j,i,2)==img2.item(j,0,2))):
						continue
					elif ((img1.item(j,i,0)>=img2.item(j,0,0)-t) and (img1.item(j,i,0)<=img2.item(j,0,0)+t) and (img1.item(j,i,1)>=img2.item(j,0,1)-t) and (img1.item(j,i,1)<=img2.item(j,0,1)+t) and (img1.item(j,i,2)>=img2.item(j,0,2)-t) and (img1.item(j,i,2)<=img2.item(j,0,2)+t)):
						continue
					else:
						flag = 1
						break
				if flag==0:
					break
				i = i-1
			temp_img = img1[0:im1size[0], 0:i-1]
			new_img = np.concatenate((temp_img, img2), axis=1)
			roadmap = np.concatenate((img3[0:im1size[0], 0:i-1], img4), axis=1)
		big_img2 = new_img
		big_img4 = roadmap
		if x==1:
			big_img1 = big_img2
			big_img3 = big_img4
		else:
			im1size = big_img1.shape
			im2size = big_img2.shape
			i = im1size[0]-394-1
			while i>=im1size[0]-394-1-7:
				flag = 0
				t = 10
				for j in range(10,1000):
					if ((big_img1.item(i,j,0)==big_img2.item(0,j,0)) and (big_img1.item(i,j,1)==big_img2.item(0,j,1)) and (big_img1.item(i,j,2)==big_img2.item(0,j,2))):
						continue
					elif ((big_img1.item(i,j,0)>=big_img2.item(0,j,0)-t) and (big_img1.item(i,j,0)<=big_img2.item(0,j,0)+t) and (big_img1.item(i,j,1)>=big_img2.item(0,j,1)-t) and (big_img1.item(i,j,1)<=big_img2.item(0,j,1)+t) and (big_img1.item(i,j,2)>=big_img2.item(0,j,2)-t) and (big_img1.item(i,j,2)<=big_img2.item(0,j,2)+t)):
						continue
					else:
						flag = 1
						break
				if flag==0:
					break
				i = i-1
			if im1size[1]!=im2size[1]:
				if im1size[1]<im2size[1]:
					pad_img = np.zeros((im1size[0],im2size[1]-im1size[1],3),dtype = big_img1.dtype)
					big_img1 = np.concatenate((big_img1, pad_img), axis=1)
					big_img3 = np.concatenate((big_img3, pad_img), axis=1)
					im1size = big_img1.shape
				else:
					pad_img = np.zeros((im2size[0],im1size[1]-im2size[1],3),dtype = big_img2.dtype)
					big_img2 = np.concatenate((big_img2, pad_img), axis=1)
					big_img4 = np.concatenate((big_img4, pad_img), axis=1)
					im2size = big_img2.shape
			temp_img = big_img1[0:i-1, 0:im1size[1]]
			new_img = np.concatenate((temp_img, big_img2), axis=0)
			roadmap = np.concatenate((big_img3[0:i-1, 0:im1size[1]], big_img4), axis=0)
			big_img1 = new_img
			big_img3 = roadmap
	
	cv2.imwrite(str(output_folder)+'/'+'Satellite.png', new_img)
	cv2.imwrite(str(output_folder)+'/'+'Roadmap.png', roadmap)
	return True