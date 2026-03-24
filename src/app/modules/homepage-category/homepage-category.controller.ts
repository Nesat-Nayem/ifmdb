import { NextFunction, Request, Response } from "express";
import { HomepageCategory } from "./homepage-category.model";
import { homepageCategoryValidation, homepageCategoryUpdateValidation } from "./homepage-category.validation";
import { appError } from "../../errors/appError";
import { cloudinary } from "../../config/cloudinary";

export const createHomepageCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, isActive, order, link } = req.body;
    
    if (!req.file) {
       next(new appError("Category image is required", 400));
       return;
    }

    const image = req.file.path;
    
    const validatedData = homepageCategoryValidation.parse({ 
      title, 
      image,
      link: link || '',
      isActive: isActive === 'true' || isActive === true,
      order: order ? parseInt(order as string) : undefined
    });

    const category = new HomepageCategory(validatedData);
    await category.save();

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Homepage category created successfully",
      data: category,
    });
    return;
  } catch (error) {
    if (req.file?.path) {
      const publicId = req.file.path.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`restaurant-banners/${publicId}`);
      }
    }
    next(error);
  }
};

export const getAllHomepageCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { active } = req.query;
    const filter: any = { isDeleted: false };
    
    if (active === 'true') {
      filter.isActive = true;
    }
    
    const categories = await HomepageCategory.find(filter).sort({ order: 1, createdAt: -1 });
    
    if (categories.length === 0) {
       res.json({
        success: true,
        statusCode: 200,
        message: "No homepage categories found",
        data: [],
      });
      return
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Homepage categories retrieved successfully",
      data: categories,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const getHomepageCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await HomepageCategory.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    });
    
    if (!category) {
      return next(new appError("Homepage category not found", 404));
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Homepage category retrieved successfully",
      data: category,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const updateHomepageCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = req.params.id;
    const { title, isActive, order, link } = req.body;
    
    const category = await HomepageCategory.findOne({ 
      _id: categoryId, 
      isDeleted: false 
    });
    
    if (!category) {
       next(new appError("Homepage category not found", 404));
       return;
    }

    const updateData: any = {};
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true;
    }
    
    if (order !== undefined) {
      updateData.order = parseInt(order as string);
    }

    if (link !== undefined) {
      updateData.link = link;
    }

    if (req.file) {
      updateData.image = req.file.path;
      
      if (category.image) {
        const publicId = category.image.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`restaurant-banners/${publicId}`);
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      const validatedData = homepageCategoryUpdateValidation.parse(updateData);
      
      const updatedCategory = await HomepageCategory.findByIdAndUpdate(
        categoryId,
        validatedData,
        { new: true }
      );

       res.json({
        success: true,
        statusCode: 200,
        message: "Homepage category updated successfully",
        data: updatedCategory,
      });
      return;
    }

     res.json({
      success: true,
      statusCode: 200,
      message: "No changes to update",
      data: category,
    });
    return;

  } catch (error) {
    if (req.file?.path) {
      const publicId = req.file.path.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`restaurant-banners/${publicId}`);
      }
    }
    next(error);
  }
};

export const deleteHomepageCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await HomepageCategory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    
    if (!category) {
       next(new appError("Homepage category not found", 404));
       return;
    }

    res.json({
      success: true,
      statusCode: 200,
      message: "Homepage category deleted successfully",
      data: category,
    });
    return;
  } catch (error) {
    next(error);
  }
};
