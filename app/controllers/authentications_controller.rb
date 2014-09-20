class AuthenticationsController < ApplicationController
  # GET /authentications
  # GET /authentications.json
  def index
    @authentications = Authentication.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @authentications }
    end
  end
  
  def create_social_auth
    omniauth = request.env["omniauth.auth"]
    authentication = nil
    session[:from] = request.env["HTTP_REFERER"].present? ? request.env["HTTP_REFERER"] : session[:from]
    session[:from] = session[:user_return_to] if session[:user_return_to].present?
    session[:from] = session[:create_new_story] if session[:create_new_story].present?
    session[:create_new_story] = nil
    session[:to] = request.env["ORIGINAL_FULLPATH"]
    session[:params_before] = params
    authentication = Authentication.where(uid: omniauth['uid']).where(provider: omniauth['provider']).first
    user = nil
    # logger.info("\n\n\n\n\n\n=== #{omniauth.to_yaml}\n\n#{omniauth['provider']}\n\n\n\n\n")
    if(omniauth['provider'] == "facebook")
      user = User.where(email: omniauth['info']['email'].to_s).first if(omniauth['info']['email'].present?)
    elsif(omniauth['provider'] == "google")
      user = User.where(email: omniauth['info']['email'].to_s).first if(omniauth['info']['email'].present?)
    end
    if(authentication.present? && authentication.user.present?)
      token = ""
      token = omniauth['credentials']['token'] if(omniauth['credentials'].present? && omniauth['credentials']['token'].present?)
      authentication.update_attribute(:access_token, token) 
      authentication.user = Authentication.assign_social_data_to_user(authentication.user, omniauth, true)
      authentication.user.save
      sign_in_and_redirect(:user, authentication.user)      
    elsif false
      # !current_user.nil has been replaced by false, need to check with probable solutions
      token = ""
      token = omniauth['credentials']['token'] if(omniauth['credentials'].present? && !omniauth['credentials']['token'].present?)
      auth = current_user.authentications.create!(:provider => omniauth['provider'], :uid => omniauth['uid'], :access_token => token)
      current_user = Authentication.assign_social_data_to_user(current_user, omniauth, true)
      current_user.save
      redirect_to root_path
    else
      if(omniauth['provider'].to_s == "facebook")
        user_email = omniauth['info']['email']
      elsif(omniauth['provider'].to_s == "twitter")
        user_email = "#{omniauth['uid']}-no-email-available@no-email.expin"
      elsif(omniauth['provider'].to_s == "google")
        user_email = omniauth['info']['email']
      end
      user = User.where(email: user_email.to_s).first
      if(user.nil?)
        user = User.new
      end
      user.email = user_email
      user.password = Util.random_alphanumeric(10)
      user.confirmed_at = DateTime.now if user.confirmed_at.blank?
      if session[:from].present?
        user.user_analytics[:req_address] = session[:from] if user.user_analytics["req_address"].blank?
      end  
      if(authentication) 
        auth = authentication
      else
        auth = user.apply_omniauth(omniauth)
      end
      user = Authentication.assign_social_data_to_user(user, omniauth, true)
      if(user.save)
        auth.save
        sign_in_and_redirect(:user, user)
      else
        session[:omniauth] = omniauth.except('extra')
        redirect_to new_user_registration_url
      end
    end
  end
  # GET /authentications/1
  # GET /authentications/1.json
  def show
    @authentication = Authentication.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @authentication }
    end
  end

  # GET /authentications/new
  # GET /authentications/new.json
  def new
    @authentication = Authentication.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @authentication }
    end
  end

  # GET /authentications/1/edit
  def edit
    @authentication = Authentication.find(params[:id])
  end

  # POST /authentications
  # POST /authentications.json
  def create
    @authentication = Authentication.new(params[:authentication])

    respond_to do |format|
      if @authentication.save
        format.html { redirect_to @authentication, notice: 'Authentication was successfully created.' }
        format.json { render json: @authentication, status: :created, location: @authentication }
      else
        format.html { render action: "new" }
        format.json { render json: @authentication.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /authentications/1
  # PUT /authentications/1.json
  def update
    @authentication = Authentication.find(params[:id])

    respond_to do |format|
      if @authentication.update_attributes(params[:authentication])
        format.html { redirect_to @authentication, notice: 'Authentication was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @authentication.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /authentications/1
  # DELETE /authentications/1.json
  def destroy
    @authentication = Authentication.find(params[:id])
    @authentication.destroy

    respond_to do |format|
      format.html { redirect_to authentications_url }
      format.json { head :no_content }
    end
  end
end
