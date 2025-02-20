cmake_minimum_required(VERSION 3.10.2)
project(dummy_native)
include_directories(${SRC})
file(GLOB JNI_SRC ${CMAKE_CURRENT_SOURCE_DIR}/src/main/jni/*.cpp ${CMAKE_CURRENT_SOURCE_DIR}/src/main/jni/*.h) # 扫描jni目录下的头文件和库文件, 并设置给JNI_SRC
add_library(dummy SHARED ${JNI_SRC}) # 添加jni中转库
target_link_libraries(dummy c++)

#set(LIBCPP_SHARED_PATH ${CMAKE_CURRENT_SOURCE_DIR}/build/stripped_native_libs/debug/stripDebugDebugSymbols/out/lib/${CMAKE_ANDROID_ARCH_ABI})
#MESSAGE(${LIBCPP_SHARED_PATH})
#file(COPY ${LIBCPP_SHARED_PATH}/libc++_shared.so DESTINATION ${CMAKE_SOURCE_DIR}/main/assets/${ANDROID_ABI})